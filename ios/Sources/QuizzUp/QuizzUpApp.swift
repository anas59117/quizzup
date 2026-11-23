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
        // Kick off AdMob as early as possible so the first interstitial is
        // in memory by the time a match finishes. ATT is NOT requested here
        // (Apple rejects apps that prompt during the splash); it's deferred
        // to the first match-end in ResultView. Skipped in App-Store-capture
        // builds so the screenshot runs are never interrupted by an ad.
        #if !(DEBUG && STORE_CAPTURE)
        AdsManager.shared.start()
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
