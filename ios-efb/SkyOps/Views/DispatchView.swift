import SwiftUI

/// Flight dispatch and pre-flight briefing view.
struct DispatchView: View {
    @StateObject private var viewModel = DispatchViewModel()

    var body: some View {
        NavigationView {
            List {
                Section("Select Flight") {
                    flightPicker
                }

                if let flight = viewModel.selectedFlight {
                    Section("Flight Details") {
                        flightSummary(flight)
                    }

                    Section("Weather Package") {
                        weatherPackageRow(icao: flight.departure,   label: "Departure")
                        weatherPackageRow(icao: flight.destination, label: "Destination")
                    }

                    Section("NOTAMs") {
                        if viewModel.relevantNotams.isEmpty {
                            Text("No relevant NOTAMs")
                                .foregroundColor(.secondary)
                        } else {
                            ForEach(viewModel.relevantNotams) { notam in
                                NotamRowView(notam: notam)
                            }
                        }
                    }

                    Section {
                        Button(action: { Task { await viewModel.generateBriefing() } }) {
                            HStack {
                                Spacer()
                                if viewModel.isGenerating {
                                    ProgressView()
                                } else {
                                    Label("Generate Briefing Package", systemImage: "doc.badge.plus")
                                        .bold()
                                }
                                Spacer()
                            }
                        }
                        .disabled(viewModel.isGenerating)
                    }

                    if let briefing = viewModel.briefing {
                        Section("Briefing Package") {
                            briefingView(briefing)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Dispatch")
            .task { await viewModel.loadFlights() }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }

    // MARK: - Sub-views

    private var flightPicker: some View {
        Picker("Flight", selection: $viewModel.selectedFlightID) {
            Text("Select…").tag(Optional<String>.none)
            ForEach(viewModel.upcomingFlights) { f in
                Text("\(f.flightNumber) — \(f.route)")
                    .tag(Optional(f.id))
            }
        }
        .pickerStyle(.menu)
        .onChange(of: viewModel.selectedFlightID) { _ in
            Task { await viewModel.loadDispatchData() }
        }
    }

    private func flightSummary(_ flight: Flight) -> some View {
        Group {
            LabeledContent("Flight #", value: flight.flightNumber)
            LabeledContent("Route", value: flight.route)
            LabeledContent("Departure", value: flight.departureTime.formatted(date: .abbreviated, time: .shortened))
            LabeledContent("Aircraft", value: flight.aircraft)
            LabeledContent("Status") { FlightStatusBadge(status: flight.status) }
        }
    }

    private func weatherPackageRow(icao: String, label: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            if let wx = viewModel.weatherPackage[icao] {
                FlightCategoryBadge(category: wx.flightCategory)
                Text(wx.windString)
                    .font(.caption.monospaced())
                    .foregroundColor(.secondary)
            } else {
                ProgressView()
                    .scaleEffect(0.7)
            }
        }
    }

    private func briefingView(_ briefing: DispatchBriefing) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Generated: \(briefing.generatedAt.formatted())")
                .font(.caption)
                .foregroundColor(.secondary)
            Text(briefing.summary)
                .font(.body)
            Divider()
            ForEach(briefing.items, id: \.title) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title).font(.subheadline.bold())
                    Text(item.content).font(.caption).foregroundColor(.secondary)
                }
            }
            Button(action: { viewModel.shareBriefing(briefing) }) {
                Label("Share Briefing", systemImage: "square.and.arrow.up")
            }
        }
    }
}

// MARK: - Models (local to Dispatch)

struct DispatchBriefing {
    let generatedAt: Date
    let summary: String
    let items: [BriefingItem]

    struct BriefingItem {
        let title: String
        let content: String
    }
}

// MARK: - ViewModel

@MainActor
final class DispatchViewModel: ObservableObject {
    @Published var upcomingFlights: [Flight] = []
    @Published var selectedFlightID: String? = nil
    @Published var relevantNotams: [Notam] = []
    @Published var weatherPackage: [String: Weather] = [:]
    @Published var briefing: DispatchBriefing?
    @Published var isGenerating = false
    @Published var showError = false
    @Published var errorMessage = ""

    var selectedFlight: Flight? {
        upcomingFlights.first { $0.id == selectedFlightID }
    }

    func loadFlights() async {
        do {
            let all = try await FlightService.shared.fetchFlightsAsync()
            upcomingFlights = all.filter { $0.status == .scheduled || $0.status == .delayed }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }

    func loadDispatchData() async {
        guard let flight = selectedFlight else { return }
        weatherPackage = [:]
        relevantNotams = []
        briefing = nil

        // Load weather for departure and destination in parallel.
        async let depWx  = WeatherService.shared.fetchWeatherAsync(for: flight.departure)
        async let destWx = WeatherService.shared.fetchWeatherAsync(for: flight.destination)

        do {
            let (dep, dest) = try await (depWx, destWx)
            weatherPackage[flight.departure]   = dep
            weatherPackage[flight.destination] = dest
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }

        // Load relevant NOTAMs.
        do {
            let all: [Notam] = try await APIService.shared.fetch([Notam].self, from: "/notams")
            relevantNotams = all.filter {
                $0.icao == flight.departure || $0.icao == flight.destination
            }
        } catch { /* non-fatal */ }
    }

    func generateBriefing() async {
        guard let flight = selectedFlight else { return }
        isGenerating = true
        defer { isGenerating = false }

        var items: [DispatchBriefing.BriefingItem] = []

        if let depWx = weatherPackage[flight.departure] {
            items.append(.init(title: "Departure Weather (\(flight.departure))",
                               content: depWx.rawText))
        }
        if let destWx = weatherPackage[flight.destination] {
            items.append(.init(title: "Destination Weather (\(flight.destination))",
                               content: destWx.rawText))
        }
        if !relevantNotams.isEmpty {
            let text = relevantNotams.map { "\($0.notamNumber): \($0.text)" }.joined(separator: "\n")
            items.append(.init(title: "NOTAMs", content: text))
        }

        briefing = DispatchBriefing(
            generatedAt: Date(),
            summary: "Pre-flight briefing for \(flight.flightNumber) — \(flight.route)",
            items: items
        )
    }

    func shareBriefing(_ briefing: DispatchBriefing) {
        let text = ([briefing.summary] + briefing.items.map { "\($0.title)\n\($0.content)" })
            .joined(separator: "\n\n")
        let vc = UIActivityViewController(activityItems: [text], applicationActivities: nil)
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.rootViewController?
            .present(vc, animated: true)
    }
}

#Preview {
    DispatchView()
}
