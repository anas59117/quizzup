import SwiftUI
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency

@MainActor
final class AdsManager: NSObject, ObservableObject {
    static let shared = AdsManager()
    // Explicit test mode until BOTH publisher IDs and AdMob privacy messages
    // are configured. This mode does not generate advertising revenue.
    static let testInterstitialUnitID = "ca-app-pub-3940256099942544/4411468910"
    private var interstitialUnitID: String? {
        if Bundle.main.object(forInfoDictionaryKey: "QuizzUpAdsTestMode") as? Bool == true {
            return Self.testInterstitialUnitID
        }
        let appID = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String ?? ""
        let unitID = Bundle.main.object(forInfoDictionaryKey: "QuizzUpInterstitialUnitID") as? String ?? ""
        guard appID.hasPrefix("ca-app-pub-"), !appID.contains("3940256099942544"),
              unitID.hasPrefix("ca-app-pub-"), unitID.contains("/"),
              !unitID.contains("3940256099942544") else { return nil }
        return unitID
    }

    @Published private(set) var privacyOptionsRequired = false
    @Published private(set) var consentBusy = false
    @Published private(set) var privacyError = false
    var isPremium = false {
        didSet {
            if isPremium { invalidateAd() }
            else { startAdsIfAllowed() }
        }
    }
    private let policy = NativeAdsPolicy()
    private let launch = NativeAdContinuation()
    private var interstitial: GADInterstitialAd?
    private var presentedAd: GADInterstitialAd?
    private var loadedAt: Date?
    private var loadGeneration = UUID()
    private var isLoading = false
    private var consentAttempted = false
    private var consentFinished = false
    private var consentFormPending = false
    var presentationAllowed: () -> Bool = { false }
    private var sdkStarted = false
    private var sdkStarting = false
    private var trackingPending = false
    private var trackingBusy = false

    private var canRequestAds: Bool {
        NativeAdsPolicy.mayRequestAds(consent: UMPConsentInformation.sharedInstance.canRequestAds,
                                     premium: isPremium) && !consentBusy && !trackingBusy
    }

    /// Start from a visible active scene, after the premium state is known.
    func start() {
        guard !consentAttempted, interstitialUnitID != nil,
              UIApplication.shared.applicationState == .active,
              UIApplication.shared.topMostViewController != nil else { return }
        consentAttempted = true
        consentBusy = true
        let parameters = UMPRequestParameters()
        parameters.tagForUnderAgeOfConsent = false
        // Real geography on physical devices. UMP recognises simulators as
        // test devices; additional test devices are registered explicitly.
        UMPConsentInformation.sharedInstance.requestConsentInfoUpdate(with: parameters) { [weak self] error in
            Task { @MainActor in
                guard let self else { return }
                self.privacyOptionsRequired = UMPConsentInformation.sharedInstance.privacyOptionsRequirementStatus == .required
                guard error == nil else {
                    self.finishConsent()
                    return
                }
                self.consentFormPending = true
                self.presentPendingConsentIfPossible()
            }
        }
    }

    private func presentPendingConsentIfPossible() {
        guard consentFormPending, presentationAllowed(),
              UIApplication.shared.applicationState == .active,
              UIApplication.shared.activeRootViewController?.presentedViewController == nil,
              let presenter = UIApplication.shared.topMostViewController else { return }
        consentFormPending = false
        UMPConsentForm.loadAndPresentIfRequired(from: presenter) { [weak self] _ in
            Task { @MainActor in self?.finishConsent() }
        }
    }

    private func finishConsent() {
        consentBusy = false
        consentFinished = true
        privacyOptionsRequired = UMPConsentInformation.sharedInstance.privacyOptionsRequirementStatus == .required
        // On an error, cached consent is usable ONLY when UMP authorises it.
        // Otherwise the player can keep playing without any ad request.
        startAdsIfAllowed()
        requestTrackingAuthorizationIfNeeded()
    }

    func presentPrivacyOptions() {
        guard !consentBusy, !trackingBusy, !launch.isPending,
              let presenter = UIApplication.shared.topMostViewController else { return }
        consentBusy = true
        privacyError = false
        invalidateAd()
        UMPConsentForm.presentPrivacyOptionsForm(from: presenter) { [weak self] error in
            Task { @MainActor in
                self?.privacyError = error != nil
                self?.finishConsent()
            }
        }
    }

    func sceneBecameActive() {
        start()
        presentPendingConsentIfPossible()
        requestTrackingAuthorizationIfNeeded()
        startAdsIfAllowed()
    }

    func noteMatchFinished(id: String) {
        policy.noteCompletedMatch(id: id)
        trackingPending = true
    }

    func requestTrackingAuthorizationIfNeeded() {
        guard trackingPending, presentationAllowed(), !isPremium, consentFinished, !consentBusy, !trackingBusy,
              !launch.isPending, UIApplication.shared.applicationState == .active,
              UIApplication.shared.activeRootViewController?.presentedViewController == nil,
              UMPConsentInformation.sharedInstance.canRequestAds else { return }
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
            trackingPending = false
            return
        }
        trackingPending = false
        trackingBusy = true
        invalidateAd()
        ATTrackingManager.requestTrackingAuthorization { [weak self] _ in
            Task { @MainActor in
                self?.trackingBusy = false
                self?.startAdsIfAllowed()
            }
        }
    }

    /// Unavailable/unauthorised ads never hold up the player's next game.
    func maybePresent(then: @escaping () -> Void) {
        guard !launch.isPending else { return }
        guard canRequestAds, policy.isDue(at: Date().timeIntervalSince1970),
              UIApplication.shared.applicationState == .active,
              let presenter = UIApplication.shared.topMostViewController,
              !presenter.isBeingDismissed else { then(); return }
        if let loadedAt, Date().timeIntervalSince(loadedAt) >= 3600 { invalidateAd() }
        guard let ad = interstitial else { then(); loadInterstitialIfNeeded(); return }
        do { try ad.canPresent(fromRootViewController: presenter) }
        catch { invalidateAd(); then(); loadInterstitialIfNeeded(); return }
        guard launch.begin(then) else { return }
        presentedAd = ad
        interstitial = nil
        ad.fullScreenContentDelegate = self
        ad.present(fromRootViewController: presenter)
    }

    private func invalidateAd() {
        loadGeneration = UUID()
        interstitial = nil
        loadedAt = nil
        isLoading = false
    }

    private func startAdsIfAllowed() {
        guard consentFinished, canRequestAds, interstitialUnitID != nil else { return }
        if sdkStarted { loadInterstitialIfNeeded(); return }
        guard !sdkStarting else { return }
        sdkStarting = true
        GADMobileAds.sharedInstance().start { [weak self] _ in
            Task { @MainActor in
                self?.sdkStarting = false
                self?.sdkStarted = true
                self?.loadInterstitialIfNeeded()
            }
        }
    }

    private func loadInterstitialIfNeeded() {
        guard sdkStarted, canRequestAds, !launch.isPending, !isLoading, interstitial == nil,
              let unitID = interstitialUnitID else { return }
        isLoading = true
        let generation = loadGeneration
        GADInterstitialAd.load(withAdUnitID: unitID, request: GADRequest()) { [weak self] ad, error in
            Task { @MainActor in
                guard let self, self.loadGeneration == generation else { return }
                self.isLoading = false
                guard error == nil, self.canRequestAds else { return }
                self.interstitial = ad
                self.loadedAt = Date()
            }
        }
    }

    private func finishPresentation(_ ad: GADFullScreenPresentingAd) {
        guard let presentedAd, (ad as AnyObject) === presentedAd else { return }
        self.presentedAd = nil
        launch.finish()
        loadInterstitialIfNeeded()
    }
}

extension AdsManager: GADFullScreenContentDelegate {
    nonisolated func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in self.finishPresentation(ad) }
    }
    nonisolated func adWillPresentFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        Task { @MainActor in
            guard let shown = self.presentedAd, (ad as AnyObject) === shown else { return }
            self.policy.noteAdShown(at: Date().timeIntervalSince1970)
        }
    }
    nonisolated func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        Task { @MainActor in self.finishPresentation(ad) }
    }
}

extension UIApplication {
    var activeRootViewController: UIViewController? {
        let scene = connectedScenes.compactMap { $0 as? UIWindowScene }
            .first(where: { $0.activationState == .foregroundActive })
        return (scene?.windows.first(where: { $0.isKeyWindow }) ?? scene?.windows.first)?.rootViewController
    }
    var topMostViewController: UIViewController? {
        var controller = activeRootViewController
        while let presented = controller?.presentedViewController { controller = presented }
        return controller
    }
}
