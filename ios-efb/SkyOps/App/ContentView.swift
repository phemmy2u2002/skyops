import SwiftUI

/// Root view providing the main tab-bar navigation for authenticated users.
struct ContentView: View {
    @EnvironmentObject var authService: AuthService

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }

            FlightsView()
                .tabItem {
                    Label("Flights", systemImage: "airplane")
                }

            WeatherView()
                .tabItem {
                    Label("Weather", systemImage: "cloud.sun.fill")
                }

            NotamsView()
                .tabItem {
                    Label("NOTAMs", systemImage: "exclamationmark.triangle.fill")
                }

            DispatchView()
                .tabItem {
                    Label("Dispatch", systemImage: "doc.text.fill")
                }
        }
        .accentColor(.skyBlue)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService.shared)
}
