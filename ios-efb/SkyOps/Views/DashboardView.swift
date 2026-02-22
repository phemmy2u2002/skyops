import SwiftUI
import Combine

/// Main dashboard showing active flights, weather summary, and recent alerts.
struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    flightSummarySection
                    weatherSummarySection
                    activeNotamsSection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { viewModel.refresh() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .refreshable { viewModel.refresh() }
            .task { viewModel.load() }
        }
    }

    // MARK: - Sections

    private var flightSummarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Active Flights", icon: "airplane")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(title: "Scheduled", value: "\(viewModel.scheduledCount)", color: .skyBlue)
                StatCard(title: "En Route",  value: "\(viewModel.enRouteCount)",  color: .green)
                StatCard(title: "Delayed",   value: "\(viewModel.delayedCount)",  color: .orange)
                StatCard(title: "Arrived",   value: "\(viewModel.arrivedCount)",  color: .secondary)
            }
        }
    }

    private var weatherSummarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Weather Overview", icon: "cloud.sun.fill")
            if viewModel.weatherItems.isEmpty {
                emptyState("No weather data available")
            } else {
                ForEach(viewModel.weatherItems) { wx in
                    WeatherSummaryRow(weather: wx)
                }
            }
        }
    }

    private var activeNotamsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("Active NOTAMs", icon: "exclamationmark.triangle.fill")
            if viewModel.recentNotams.isEmpty {
                emptyState("No active NOTAMs")
            } else {
                ForEach(viewModel.recentNotams) { notam in
                    NotamSummaryRow(notam: notam)
                }
            }
        }
    }

    // MARK: - Helpers

    private func sectionHeader(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.headline)
            .foregroundColor(.primary)
    }

    private func emptyState(_ message: String) -> some View {
        Text(message)
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding()
    }
}

// MARK: - Sub-views

private struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack {
            Text(value)
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

private struct WeatherSummaryRow: View {
    let weather: Weather

    var body: some View {
        HStack {
            Text(weather.icao)
                .font(.headline.monospaced())
                .frame(width: 60, alignment: .leading)
            FlightCategoryBadge(category: weather.flightCategory)
            Spacer()
            Text(weather.windString)
                .font(.caption.monospaced())
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

private struct NotamSummaryRow: View {
    let notam: Notam

    var body: some View {
        HStack(alignment: .top) {
            Image(systemName: notam.type.sfSymbol)
                .foregroundColor(.orange)
            VStack(alignment: .leading, spacing: 2) {
                Text(notam.notamNumber)
                    .font(.caption.bold())
                Text(notam.text)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

// MARK: - ViewModel

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var weatherItems: [Weather] = []
    @Published var recentNotams: [Notam] = []
    @Published var scheduledCount = 0
    @Published var enRouteCount   = 0
    @Published var delayedCount   = 0
    @Published var arrivedCount   = 0

    private var cancellables = Set<AnyCancellable>()

    func load() {
        FlightService.shared.fetchFlights()
            .receive(on: DispatchQueue.main)
            .sink { _ in } receiveValue: { [weak self] flights in
                self?.scheduledCount = flights.filter { $0.status == .scheduled }.count
                self?.enRouteCount   = flights.filter { $0.status == .enRoute   }.count
                self?.delayedCount   = flights.filter { $0.status == .delayed   }.count
                self?.arrivedCount   = flights.filter { $0.status == .arrived   }.count
            }
            .store(in: &cancellables)
    }

    func refresh() { load() }
}

#Preview {
    DashboardView()
}
