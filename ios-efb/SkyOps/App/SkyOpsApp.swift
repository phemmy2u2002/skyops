import SwiftUI
import CoreData

@main
struct SkyOpsApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    /// Shared Core Data stack injected into the environment.
    let persistenceController = CoreDataManager.shared

    @StateObject private var authService = AuthService.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if authService.isAuthenticated {
                    ContentView()
                        .environment(\.managedObjectContext, persistenceController.viewContext)
                        .environmentObject(authService)
                } else {
                    LoginView()
                        .environmentObject(authService)
                }
            }
            .onAppear {
                authService.restoreSession()
            }
        }
    }
}
