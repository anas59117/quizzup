import SwiftUI
import GoogleSignIn

@main
struct QuizzUpApp: App {
    @StateObject private var game = GameSocket()
    @StateObject private var auth = AuthManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(game)
                .environmentObject(auth)
                .preferredColorScheme(.dark)
                // Completes Google Sign-In's OAuth redirect back into the app.
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
