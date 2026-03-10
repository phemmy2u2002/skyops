import SwiftUI
import Combine

/// Displays METAR and TAF weather data for queried ICAO stations.
struct WeatherView: View {
    @StateObject private var viewModel = WeatherViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                searchBar
                Group {
                    if viewModel.isLoading {
                        ProgressView("Fetching weather…")
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if let wx = viewModel.currentWeather {
                        weatherContent(wx)
                    } else {
                        placeholderView
                    }
                }
            }
            .navigationTitle("Weather")
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }

    // MARK: - Sub-views

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            TextField("Enter ICAO (e.g. KJFK)", text: $viewModel.icaoQuery)
                .autocapitalization(.allCharacters)
                .disableAutocorrection(true)
                .submitLabel(.search)
                .onSubmit { Task { await viewModel.fetchWeather() } }
            if !viewModel.icaoQuery.isEmpty {
                Button(action: { viewModel.icaoQuery = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
        .padding()
    }

    private func weatherContent(_ wx: Weather) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                headerCard(wx)
                conditionsGrid(wx)
                rawMetarCard(wx)
                if let taf = wx.taf {
                    tafCard(taf)
                }
            }
            .padding()
        }
    }

    private func headerCard(_ wx: Weather) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(wx.icao)
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                Text(wx.observationTime.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            FlightCategoryBadge(category: wx.flightCategory)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func conditionsGrid(_ wx: Weather) -> some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
            WeatherDataCell(label: "Wind",        value: wx.windString,               icon: "wind")
            WeatherDataCell(label: "Visibility",  value: "\(wx.visibility, specifier: "%.1f") SM", icon: "eye")
            WeatherDataCell(label: "Ceiling",     value: wx.ceiling.map { "\($0) ft" } ?? "SKC", icon: "cloud")
            WeatherDataCell(label: "Temperature", value: "\(wx.temperature, specifier: "%.0f")°C / \(wx.dewpoint, specifier: "%.0f")°C", icon: "thermometer.medium")
            WeatherDataCell(label: "Altimeter",   value: "\(wx.altimeter, specifier: "%.2f") inHg", icon: "gauge")
            WeatherDataCell(label: "Temp-Dew Spread", value: "\(wx.tempDewSpread, specifier: "%.0f")°C", icon: "drop.fill")
        }
    }

    private func rawMetarCard(_ wx: Weather) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Raw METAR", systemImage: "text.alignleft")
                .font(.headline)
            Text(wx.rawText)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)
                .textSelection(.enabled)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private func tafCard(_ taf: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("TAF", systemImage: "chart.line.uptrend.xyaxis")
                .font(.headline)
            Text(taf)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.secondary)
                .textSelection(.enabled)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var placeholderView: some View {
        VStack(spacing: 16) {
            Image(systemName: "cloud.sun.fill")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("Enter an ICAO code to fetch weather")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - WeatherDataCell

private struct WeatherDataCell: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundColor(.skyBlue)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline.bold())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

// MARK: - ViewModel

@MainActor
final class WeatherViewModel: ObservableObject {
    @Published var icaoQuery: String = ""
    @Published var currentWeather: Weather?
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage = ""

    func fetchWeather() async {
        let icao = icaoQuery.trimmingCharacters(in: .whitespaces).uppercased()
        guard AviationHelpers.isValidICAO(icao) else {
            errorMessage = "'\(icao)' is not a valid ICAO airport code."
            showError = true
            return
        }
        isLoading = true
        do {
            currentWeather = try await WeatherService.shared.fetchWeatherAsync(for: icao)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
}

#Preview {
    WeatherView()
}
