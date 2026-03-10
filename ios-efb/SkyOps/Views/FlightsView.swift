import SwiftUI
import Combine

/// Lists all flights with search and status filtering.
struct FlightsView: View {
    @StateObject private var viewModel = FlightsViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading flights…")
                } else if viewModel.filtered.isEmpty {
                    emptyState
                } else {
                    flightList
                }
            }
            .navigationTitle("Flights")
            .searchable(text: $viewModel.searchText, prompt: "Flight #, route…")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    filterMenu
                }
            }
            .task { await viewModel.load() }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }

    // MARK: - Sub-views

    private var flightList: some View {
        List(viewModel.filtered) { flight in
            NavigationLink(destination: FlightDetailView(flight: flight)) {
                FlightRowView(flight: flight)
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await viewModel.load() }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "airplane.slash")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("No flights found")
                .font(.title3)
                .foregroundColor(.secondary)
        }
    }

    private var filterMenu: some View {
        Menu {
            ForEach(FlightsViewModel.StatusFilter.allCases, id: \.self) { filter in
                Button(action: { viewModel.statusFilter = filter }) {
                    Label(
                        filter.displayName,
                        systemImage: viewModel.statusFilter == filter ? "checkmark" : ""
                    )
                }
            }
        } label: {
            Image(systemName: "line.3.horizontal.decrease.circle")
        }
    }
}

// MARK: - FlightRowView

struct FlightRowView: View {
    let flight: Flight

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(flight.flightNumber)
                    .font(.headline)
                Text(flight.route)
                    .font(.subheadline.monospaced())
                    .foregroundColor(.secondary)
                HStack {
                    Image(systemName: "clock")
                        .font(.caption2)
                    Text(flight.departureTime.formatted(date: .omitted, time: .shortened))
                    Text("→")
                    Text(flight.arrivalTime.formatted(date: .omitted, time: .shortened))
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                FlightStatusBadge(status: flight.status)
                Text(flight.aircraft)
                    .font(.caption.monospaced())
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Flight Detail

struct FlightDetailView: View {
    let flight: Flight

    var body: some View {
        List {
            Section("Route") {
                LabeledContent("Flight", value: flight.flightNumber)
                LabeledContent("Departure", value: flight.departure)
                LabeledContent("Destination", value: flight.destination)
                LabeledContent("Departure Time", value: flight.departureTime.formatted())
                LabeledContent("Arrival Time", value: flight.arrivalTime.formatted())
                LabeledContent("Duration", value: "\(flight.durationMinutes) min")
            }
            Section("Aircraft") {
                LabeledContent("Registration", value: flight.aircraft)
                LabeledContent("Status") { FlightStatusBadge(status: flight.status) }
            }
            Section("Crew") {
                ForEach(flight.crew, id: \.id) { member in
                    LabeledContent(member.role.rawValue.capitalized, value: member.name)
                }
            }
        }
        .navigationTitle(flight.flightNumber)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Shared badge views

struct FlightStatusBadge: View {
    let status: Flight.FlightStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color(hex: status.colorHex).opacity(0.2))
            .foregroundColor(Color(hex: status.colorHex))
            .cornerRadius(6)
    }
}

struct FlightCategoryBadge: View {
    let category: Weather.FlightCategory

    var body: some View {
        Text(category.rawValue)
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color(hex: category.colorHex).opacity(0.25))
            .foregroundColor(Color(hex: category.colorHex))
            .cornerRadius(6)
    }
}

// MARK: - ViewModel

@MainActor
final class FlightsViewModel: ObservableObject {
    enum StatusFilter: CaseIterable {
        case all, scheduled, enRoute, delayed, arrived, cancelled

        var displayName: String {
            switch self {
            case .all:       return "All Flights"
            case .scheduled: return "Scheduled"
            case .enRoute:   return "En Route"
            case .delayed:   return "Delayed"
            case .arrived:   return "Arrived"
            case .cancelled: return "Cancelled"
            }
        }
    }

    @Published var flights: [Flight] = []
    @Published var searchText: String = ""
    @Published var statusFilter: StatusFilter = .all
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage = ""

    var filtered: [Flight] {
        flights
            .filter { flight in
                switch statusFilter {
                case .all:       return true
                case .scheduled: return flight.status == .scheduled
                case .enRoute:   return flight.status == .enRoute
                case .delayed:   return flight.status == .delayed
                case .arrived:   return flight.status == .arrived
                case .cancelled: return flight.status == .cancelled
                }
            }
            .filter { flight in
                guard !searchText.isEmpty else { return true }
                let q = searchText.lowercased()
                return flight.flightNumber.lowercased().contains(q)
                    || flight.departure.lowercased().contains(q)
                    || flight.destination.lowercased().contains(q)
            }
    }

    func load() async {
        isLoading = true
        do {
            flights = try await FlightService.shared.fetchFlightsAsync()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
}

#Preview {
    FlightsView()
}
