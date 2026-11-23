import SwiftUI
import GoogleSignIn

@main
@MainActor
struct QuizzUpApp: App {
    @StateObject private var game: GameSocket
    @StateObject private var auth: AuthManager
    @StateObject private var audio = NativeAudioManager()
    @StateObject private var premium = PremiumStatus()

    init() {
        let game = GameSocket()
        #if DEBUG && STORE_CAPTURE
        StoreCaptureConfiguration.prepare(game)
        #endif
        _game = StateObject(wrappedValue: game)
        _auth = StateObject(wrappedValue: AuthManager())
        #if !(DEBUG && STORE_CAPTURE)
        AdsManager.shared.presentationAllowed = { [weak game] in
            guard let game, !game.isStarting else { return false }
            return [.authGate, .join, .home, .finished].contains(game.stage)
        }
        game.beforeStartingMatch = { action in AdsManager.shared.maybePresent(then: action) }
        game.onCompletedMatch = { id in AdsManager.shared.noteMatchFinished(id: id) }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(game)
                .environmentObject(auth)
                .environmentObject(audio)
                .environmentObject(premium)
                #if DEBUG && STORE_CAPTURE
                .onAppear { StoreCaptureConfiguration.markReady() }
                #endif
                .onAppear {
                    AdsManager.shared.isPremium = premium.isPremium
                    #if !(DEBUG && STORE_CAPTURE)
                    AdsManager.shared.start()
                    #endif
                }
                .onChange(of: premium.isPremium) { newValue in
                    AdsManager.shared.isPremium = newValue
                }
                // Completes Google Sign-In's OAuth redirect back into the app.
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
