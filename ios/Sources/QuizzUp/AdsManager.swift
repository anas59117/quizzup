import SwiftUI
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency
import AdSupport

// Centralises the AdMob lifecycle for the app:
// - starts the SDK once at launch,
// - requests GDPR / EU consent via Google UMP (the Consent Management
//   Platform required by both Google's EU consent policy and the RGPD —
//   this is separate from, and runs before, Apple's ATT prompt),
// - requests ATT at the first sensible moment (never during the opening
//   splash, so it doesn't fight Apple Sign-In / Google Sign-In sheets),
// - preloads an interstitial and exposes a single `maybePresent` entry
//   point used from the end-of-match flow in `ResultView`.
//
// Consent order matters — Google UMP MUST be gathered before the Mobile
// Ads SDK makes its first ad request in an EEA/UK/CH region. We handle
// that by delaying the first `loadInterstitialIfNeeded()` until UMP is
// resolved.
//
// Business rules (locked in /areas/quizzup.md):
// - Premium users never see ads.
// - The first `freeMatchesCount` matches of a brand-new install are ad-free.
// - Thereafter an interstitial shows every `matchesBetweenAds` finished
//   matches, with a hard floor of `minSecondsBetweenAds` seconds between
//   two consecutive ads.
//
// Counters are persisted in `UserDefaults` so a background kill or an app
// relaunch doesn't let the user skip the cooldown.
@MainActor
final class AdsManager: NSObject, ObservableObject {

    // MARK: - Public config

    struct Config {
        /// Matches at the start of a fresh install that are kept ad-free so
        /// first-time players see the loop before any ad.
        var freeMatchesCount: Int = 3
        /// After the free-match grace period, serve an ad every N matches.
        var matchesBetweenAds: Int = 4
        /// Hard cooldown between two interstitials, regardless of match count.
        var minSecondsBetweenAds: TimeInterval = 180
    }

    static let shared = AdsManager()

    /// Real AdMob IDs live in Info.plist via `GADApplicationIdentifier`;
    /// the SDK reads it from there. The ad-unit ID below is the ONLY place
    /// the interstitial unit is referenced — swap the test ID for the
    /// production unit returned by the AdMob console, then rebuild.
    ///
    /// Google's reserved test IDs (safe to ship in Debug, guaranteed to
    /// serve a test creative): https://developers.google.com/admob/ios/test-ads
    static let testInterstitialUnitID = "ca-app-pub-3940256099942544/4411468910"
    static let productionInterstitialUnitID = "REPLACE_WITH_PRODUCTION_INTERSTITIAL_UNIT_ID"

    private var interstitialUnitID: String {
        #if DEBUG
        return Self.testInterstitialUnitID
        #else
        return Self.productionInterstitialUnitID.hasPrefix("REPLACE_")
            ? Self.testInterstitialUnitID
            : Self.productionInterstitialUnitID
        #endif
    }

    // MARK: - State

    var config = Config()
    var isPremium = false {
        didSet {
            if isPremium {
                interstitial = nil
                isLoading = false
            } else if started && umpResolved {
                loadInterstitialIfNeeded()
            }
        }
    }

    private var interstitial: GADInterstitialAd?
    private var isLoading = false
    private var started = false
    private var umpResolved = false
    private var pendingContinuation: (() -> Void)?

    private enum Keys {
        static let matchesSinceLastAd = "quizzup.ads.matchesSinceLastAd"
        static let totalMatchesPlayed = "quizzup.ads.totalMatchesPlayed"
        static let lastAdShownAt = "quizzup.ads.lastAdShownAt"
    }

    // MARK: - Lifecycle

    /// Call once from `QuizzUpApp.init()`. Resolves UMP consent (shows the
    /// GDPR form the first time in Europe), then starts the Google Mobile
    /// Ads SDK, then kicks off a background load of the first interstitial.
    /// ATT is NOT prompted here — that happens lazily on the first match-end.
    func start() {
        guard !started else { return }
        started = true
        gatherUMPConsent { [weak self] in
            guard let self else { return }
            self.umpResolved = true
            GADMobileAds.sharedInstance().start { _ in }
            self.loadInterstitialIfNeeded()
        }
    }

    /// Ask iOS for App Tracking Transparency consent. Must be called from a
    /// user-visible foreground state (Apple rejects apps that request ATT
    /// during the splash). We invoke it the first time a match ends.
    /// Runs AFTER UMP has resolved, so the user has already seen the GDPR
    /// explanation and the ATT prompt makes sense in context.
    func requestTrackingAuthorizationIfNeeded() {
        guard #available(iOS 14, *) else { return }
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
        ATTrackingManager.requestTrackingAuthorization { _ in
            // The SDK reads the latest status automatically on next request;
            // no need to restart. Non-personalised ads are served when the
            // user denies tracking, so revenue still flows.
        }
    }

    // MARK: - Google UMP (GDPR consent)

    /// Requests a consent info update and, if a form is available, presents
    /// it. Called once at launch from `start()`. Outside the EEA / UK / CH
    /// the UMP SDK returns almost immediately with `ConsentStatus.notRequired`
    /// and we proceed to initialise ads normally.
    private func gatherUMPConsent(_ completion: @escaping () -> Void) {
        let parameters = UMPRequestParameters()
        #if DEBUG
        // Force the EEA debug geography in Debug builds so the consent form
        // can be reviewed from a non-EU test device. Remove or flip to
        // `.disabled` in Release — real geography is used in production.
        let debugSettings = UMPDebugSettings()
        debugSettings.geography = .EEA
        parameters.debugSettings = debugSettings
        #endif
        parameters.tagForUnderAgeOfConsent = false

        UMPConsentInformation.sharedInstance.requestConsentInfoUpdate(with: parameters) { [weak self] requestError in
            guard let self else { return }
            if let requestError {
                print("UMP consent info update failed: \(requestError.localizedDescription)")
                // Fail-open: still try to initialise ads so a single UMP hiccup
                // doesn't knock out monetisation entirely. The SDK will serve
                // non-personalised ads when consent is uncertain.
                completion()
                return
            }
            Task { @MainActor in
                self.presentUMPFormIfNeeded(completion)
            }
        }
    }

    private func presentUMPFormIfNeeded(_ completion: @escaping () -> Void) {
        let status = UMPConsentInformation.sharedInstance.consentStatus
        guard status == .required else {
            // .notRequired (outside EEA) and .obtained (already answered)
            // both proceed straight to ad init.
            completion()
            return
        }
        guard let presenter = UIApplication.shared.topMostViewController else {
            // Retry once the UI is up. This runs during app launch; the
            // first scene callback will usually land a few ms later.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.presentUMPFormIfNeeded(completion)
            }
            return
        }
        UMPConsentForm.loadAndPresentIfRequired(from: presenter) { formError in
            if let formError {
                print("UMP form presentation failed: \(formError.localizedDescription)")
            }
            completion()
        }
    }

    // MARK: - Match lifecycle

    /// Call this exactly once each time a full multiplayer or solo match
    /// finishes. It handles the counter bookkeeping; it does NOT decide
    /// whether to present — presentation is `maybePresent(from:then:)`.
    func noteMatchFinished() {
        let defaults = UserDefaults.standard
        defaults.set(defaults.integer(forKey: Keys.totalMatchesPlayed) + 1, forKey: Keys.totalMatchesPlayed)
        defaults.set(defaults.integer(forKey: Keys.matchesSinceLastAd) + 1, forKey: Keys.matchesSinceLastAd)
    }

    /// Present an interstitial if business rules allow it. Calls `then`
    /// after the ad dismisses (or immediately when nothing is shown), so
    /// the caller can safely chain its own action — "Rejouer", "Nouvel
    /// adversaire" — behind this call.
    func maybePresent(from presenter: UIViewController?, then: @escaping () -> Void) {
        guard shouldPresent() else {
            then()
            return
        }
        guard let interstitial, let presenter else {
            // No ad ready → swallow this slot and move on. We don't want to
            // keep the user staring at a loader just so we can serve a pub.
            then()
            loadInterstitialIfNeeded()
            return
        }
        pendingContinuation = then
        interstitial.fullScreenContentDelegate = self
        interstitial.present(fromRootViewController: presenter)
    }

    // MARK: - Internal

    private func shouldPresent() -> Bool {
        guard !isPremium else { return false }
        let defaults = UserDefaults.standard
        let total = defaults.integer(forKey: Keys.totalMatchesPlayed)
        guard total > config.freeMatchesCount else { return false }
        let sinceLast = defaults.integer(forKey: Keys.matchesSinceLastAd)
        guard sinceLast >= config.matchesBetweenAds else { return false }
        let lastShown = defaults.double(forKey: Keys.lastAdShownAt)
        if lastShown > 0 {
            let elapsed = Date().timeIntervalSince1970 - lastShown
            guard elapsed >= config.minSecondsBetweenAds else { return false }
        }
        return true
    }

    private func loadInterstitialIfNeeded() {
        guard umpResolved, !isPremium, !isLoading, interstitial == nil else { return }
        isLoading = true
        let request = GADRequest()
        GADInterstitialAd.load(withAdUnitID: interstitialUnitID, request: request) { [weak self] ad, error in
            guard let self else { return }
            Task { @MainActor in
                self.isLoading = false
                if let error {
                    print("AdsManager interstitial load failed: \(error.localizedDescription)")
                    return
                }
                self.interstitial = ad
            }
        }
    }
}

extension AdsManager: GADFullScreenContentDelegate {
    nonisolated func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in
            self.interstitial = nil
            let continuation = self.pendingContinuation
            self.pendingContinuation = nil
            continuation?()
            self.loadInterstitialIfNeeded()
        }
    }

    nonisolated func adWillPresentFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        Task { @MainActor in
            let defaults = UserDefaults.standard
            defaults.set(Date().timeIntervalSince1970, forKey: Keys.lastAdShownAt)
            defaults.set(0, forKey: Keys.matchesSinceLastAd)
        }
    }

    nonisolated func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        Task { @MainActor in
            self.interstitial = nil
            let continuation = self.pendingContinuation
            self.pendingContinuation = nil
            continuation?()
            self.loadInterstitialIfNeeded()
        }
    }
}

// Convenience helper to find the currently presented UIViewController.
// SwiftUI gives no direct access, so we walk the active scene's key window.
extension UIApplication {
    var topMostViewController: UIViewController? {
        let scene = connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first(where: { $0.activationState == .foregroundActive })
        let window = scene?.windows.first(where: { $0.isKeyWindow }) ?? scene?.windows.first
        var controller = window?.rootViewController
        while let presented = controller?.presentedViewController {
            controller = presented
        }
        return controller
    }
}
