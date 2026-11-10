import SwiftUI
import GoogleSignIn

@main
@MainActor
struct QuizzUpApp: App {
    @StateObject private var game: GameSocket
    @StateObject private var auth: AuthManager

    init() {
        let game = GameSocket()
        #if DEBUG && STORE_CAPTURE
        StoreCaptureConfiguration.prepare(game)
        #endif
        _game = StateObject(wrappedValue: game)
        _auth = StateObject(wrappedValue: AuthManager())
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(game)
                .environmentObject(auth)
                #if DEBUG && STORE_CAPTURE
                .onAppear { StoreCaptureConfiguration.markReady() }
                #endif
                // Completes Google Sign-In's OAuth redirect back into the app.
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
