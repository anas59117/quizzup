import SwiftUI
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency

/// Google Mobile Ads 13.13.0 / UMP 3.1.0. Consent and ATT are independent gates.
@MainActor
final class AdsManager: NSObject, ObservableObject {
    static let shared = AdsManager()
    static let testInterstitialUnitID = "ca-app-pub-3940256099942544/4411468910"
    @Published private(set) var privacyOptionsRequired = false
    @Published private(set) var consentBusy = false
    @Published private(set) var privacyNotice: String?
    var presentationAllowed: () -> Bool = { false }
    var isPremium = false {
        didSet { if isPremium { invalidateAd() } else { startAdsIfAllowed() } }
    }
    private let policy = NativeAdsPolicy()
    private let launch = NativeAdContinuation()
    private var consentAttempted = false
    private var consentUpdated = false
    private var consentFormPending = false
    private var userRequestedPrivacy = false
    private var privacyFrench = true
    private var retryAfter = Date.distantPast
    private var consentGeneration = UUID()
    private var consentTimeout: Task<Void, Never>?
    private var deferredConsent: Task<Void, Never>?
    private var trackingPending = false
    private var trackingBusy = false
    private var lastTrackingStatus = ATTrackingManager.trackingAuthorizationStatus
    private var sdkStarted = false
    private var sdkStarting = false
    private var isLoading = false
    private var loadGeneration = UUID()
    private var interstitial: InterstitialAd?
    private var presentedAd: InterstitialAd?
    private var loadedAt: Date?
    private weak var adPresenter: UIViewController?
    private var presentationWatchdog: Task<Void, Never>?

    private var isCapture: Bool {
        #if STORE_CAPTURE
        return true
        #else
        return false
        #endif
    }
    private var unitID: String? {
        #if DEBUG
        let debug = true
        #else
        let debug = false
        #endif
        if NativeAdEnvironment.usesTestAds(debug: debug,
            receiptName: Bundle.main.appStoreReceiptURL?.lastPathComponent) {
            return Self.testInterstitialUnitID
        }
        let app = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String ?? ""
        let unit = Bundle.main.object(forInfoDictionaryKey: "QuizzUpInterstitialUnitID") as? String ?? ""
        return NativeAdEnvironment.validProductionIdentifiers(app: app, unit: unit) ? unit : nil
    }
    private var canRequestAds: Bool {
        !isCapture && consentUpdated && NativeAdsPolicy.mayRequestAds(
            consent: ConsentInformation.shared.canRequestAds, premium: isPremium,
            privacyBusy: consentBusy || consentFormPending || trackingBusy,
            trackingResolved: ATTrackingManager.trackingAuthorizationStatus != .notDetermined)
    }

    /// Once per app launch; errors can be retried without resetting stored choices.
    func start() {
        guard !isCapture, !consentAttempted, !consentBusy, !trackingBusy,
              !launch.isPending, Date() >= retryAfter,
              UIApplication.shared.applicationState == .active,
              UIApplication.shared.topMostViewController != nil else { return }
        consentAttempted = true
        consentBusy = true
        let generation = UUID()
        consentGeneration = generation
        consentTimeout?.cancel()
        consentTimeout = Task { @MainActor [weak self] in
            do { try await Task.sleep(nanoseconds: 30_000_000_000) } catch { return }
            guard let self, self.consentGeneration == generation else { return }
            self.consentGeneration = UUID()
            self.consentFailed()
        }
        let parameters = RequestParameters()
        parameters.isTaggedForUnderAgeOfConsent = false
        // Never spoof geography or reset consent in distributed builds.
        ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { [weak self] error in
            Task { @MainActor in
                guard let self, self.consentGeneration == generation else { return }
                self.consentTimeout?.cancel()
                self.consentBusy = false
                self.consentUpdated = true
                self.refreshPrivacyRequirement()
                guard error == nil else { self.consentFailed(); return }
                if self.userRequestedPrivacy, self.privacyOptionsRequired {
                    self.presentPrivacyOptions()
                } else if ConsentInformation.shared.consentStatus == .required {
                    self.consentFormPending = true
                    self.presentPendingConsentIfPossible()
                } else {
                    if self.userRequestedPrivacy {
                        self.showNotice(fr: "Google ne demande pas de formulaire de consentement pour votre situation actuelle.",
                            en: "Google does not currently require a consent form for your situation.")
                    }
                    self.userRequestedPrivacy = false
                    self.finishConsent()
                }
            }
        }
    }

    private func refreshPrivacyRequirement() {
        privacyOptionsRequired = ConsentInformation.shared.privacyOptionsRequirementStatus == .required
    }
    private func presentPendingConsentIfPossible() {
        guard consentFormPending, !consentBusy, !trackingBusy, !launch.isPending else { return }
        guard UIApplication.shared.applicationState == .active,
              let presenter = UIApplication.shared.topMostViewController,
              !presenter.isBeingDismissed,
              userRequestedPrivacy || (presentationAllowed() &&
                UIApplication.shared.activeRootViewController?.presentedViewController == nil) else {
            deferConsentPresentation()
            return
        }
        consentFormPending = false
        consentBusy = true
        ConsentForm.loadAndPresentIfRequired(from: presenter) { [weak self] error in
            Task { @MainActor in
                guard let self else { return }
                self.consentBusy = false
                self.refreshPrivacyRequirement()
                if error != nil || ConsentInformation.shared.consentStatus == .required {
                    self.consentFailed()
                } else {
                    self.userRequestedPrivacy = false
                    self.finishConsent()
                }
            }
        }
    }
    private func deferConsentPresentation() {
        guard deferredConsent == nil else { return }
        deferredConsent = Task { @MainActor [weak self] in
            defer { self?.deferredConsent = nil }
            // A settings sheet can dismiss without a scene/stage change.
            for _ in 0..<30 {
                do { try await Task.sleep(nanoseconds: 1_000_000_000) } catch { return }
                guard let self, self.consentFormPending,
                      UIApplication.shared.applicationState == .active,
                      self.userRequestedPrivacy || self.presentationAllowed() else { return }
                self.presentPendingConsentIfPossible()
            }
        }
    }
    private func consentFailed() {
        consentBusy = false
        consentUpdated = true
        consentFormPending = false
        consentAttempted = false
        retryAfter = Date().addingTimeInterval(30)
        if userRequestedPrivacy {
            showNotice(fr: "Les choix publicitaires sont momentanément indisponibles. Aucune modification n’a été confirmée. Réessayez plus tard.",
                en: "Advertising choices are temporarily unavailable. No change was confirmed. Please try again later.")
        }
        userRequestedPrivacy = false
        // Only UMP itself can permit use of previously stored consent on an error.
        finishConsent()
    }
    private func finishConsent() {
        refreshPrivacyRequirement()
        requestTrackingAuthorizationIfNeeded()
        startAdsIfAllowed()
    }

    /// Always gives feedback; the settings entry never silently does nothing.
    func requestPrivacyOptions(french: Bool) {
        privacyFrench = french
        privacyNotice = nil
        guard !consentBusy, !trackingBusy, !launch.isPending else {
            showNotice(fr: "Une vérification est déjà en cours. Réessayez dans un instant.",
                en: "A check is already in progress. Please try again shortly.")
            return
        }
        invalidateAd()
        userRequestedPrivacy = true
        consentAttempted = false
        retryAfter = .distantPast
        start()
        if !consentBusy {
            userRequestedPrivacy = false
            showNotice(fr: "Les choix publicitaires ne peuvent pas s’ouvrir sur cet écran. Réessayez depuis les réglages après la partie.",
                en: "Advertising choices cannot open on this screen. Try again from settings after the game.")
        }
    }
    private func presentPrivacyOptions() {
        guard let presenter = UIApplication.shared.topMostViewController,
              UIApplication.shared.applicationState == .active, !presenter.isBeingDismissed else {
            consentFailed()
            return
        }
        consentBusy = true
        ConsentForm.presentPrivacyOptionsForm(from: presenter) { [weak self] error in
            Task { @MainActor in
                guard let self else { return }
                self.consentBusy = false
                if error != nil { self.consentFailed() }
                else { self.userRequestedPrivacy = false; self.finishConsent() }
            }
        }
    }
    func clearPrivacyNotice() { privacyNotice = nil }
    private func showNotice(fr: String, en: String) { privacyNotice = privacyFrench ? fr : en }

    func sceneBecameActive() {
        let status = ATTrackingManager.trackingAuthorizationStatus
        if status != lastTrackingStatus {
            lastTrackingStatus = status
            invalidateAd()
        }
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
        guard !isCapture, trackingPending, presentationAllowed(), !isPremium, consentUpdated,
              !consentBusy, !consentFormPending, !trackingBusy, !launch.isPending,
              ConsentInformation.shared.canRequestAds,
              UIApplication.shared.applicationState == .active,
              UIApplication.shared.activeRootViewController?.presentedViewController == nil else { return }
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
            trackingPending = false
            startAdsIfAllowed()
            return
        }
        trackingPending = false
        trackingBusy = true
        invalidateAd()
        ATTrackingManager.requestTrackingAuthorization { [weak self] _ in
            Task { @MainActor in self?.trackingBusy = false; self?.startAdsIfAllowed() }
        }
    }

    /// No inventory or permission: resume gameplay immediately, without consuming cadence.
    func maybePresent(then: @escaping () -> Void) {
        guard !launch.isPending else { return }
        // isStarting is already true here, so presentationAllowed() is deliberately not used.
        guard canRequestAds, policy.isDue(at: Date().timeIntervalSince1970),
              UIApplication.shared.applicationState == .active,
              UIApplication.shared.activeRootViewController?.presentedViewController == nil,
              let presenter = UIApplication.shared.topMostViewController,
              !presenter.isBeingDismissed else { then(); return }
        if let loadedAt, Date().timeIntervalSince(loadedAt) >= 3600 { invalidateAd() }
        guard let ad = interstitial else { then(); loadInterstitialIfNeeded(); return }
        do { try ad.canPresent(from: presenter) }
        catch { invalidateAd(); then(); loadInterstitialIfNeeded(); return }
        guard launch.begin(then) else { return }
        presentedAd = ad
        adPresenter = presenter
        interstitial = nil
        ad.fullScreenContentDelegate = self
        ad.present(from: presenter)
        watchPresentation(ad)
    }
    private func invalidateAd() {
        loadGeneration = UUID()
        interstitial = nil
        loadedAt = nil
        isLoading = false
    }
    private func startAdsIfAllowed() {
        guard canRequestAds, unitID != nil else { return }
        if sdkStarted { loadInterstitialIfNeeded(); return }
        guard !sdkStarting else { return }
        sdkStarting = true
        MobileAds.shared.requestConfiguration.setPublisherFirstPartyIDEnabled(false)
        MobileAds.shared.requestConfiguration.coarseLocationCollectionEnabled = false
        MobileAds.shared.requestConfiguration.maxAdContentRating = .general
        MobileAds.shared.start { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.sdkStarting = false
                self.sdkStarted = true
                self.loadInterstitialIfNeeded()
            }
        }
    }
    private func loadInterstitialIfNeeded() {
        guard sdkStarted, canRequestAds, !launch.isPending, !isLoading,
              interstitial == nil, let unitID else { return }
        isLoading = true
        let generation = loadGeneration
        let request = Request()
        if ATTrackingManager.trackingAuthorizationStatus != .authorized {
            let extras = Extras()
            extras.additionalParameters = ["npa": "1"]
            request.register(extras)
        }
        InterstitialAd.load(with: unitID, request: request) { [weak self] ad, error in
            Task { @MainActor in
                guard let self, self.loadGeneration == generation else { return }
                self.isLoading = false
                guard error == nil, self.canRequestAds else { return }
                self.interstitial = ad
                self.loadedAt = Date()
            }
        }
    }
    private func watchPresentation(_ ad: InterstitialAd) {
        presentationWatchdog?.cancel()
        presentationWatchdog = Task { @MainActor [weak self, weak ad] in
            do { try await Task.sleep(nanoseconds: 10_000_000_000) } catch { return }
            while let self, let ad, self.presentedAd === ad, self.launch.isPending {
                // Recover only after the SDK's screen is gone, never underneath a visible ad.
                if UIApplication.shared.applicationState == .active,
                   self.adPresenter?.presentedViewController == nil {
                    self.finishPresentation(ad)
                    return
                }
                do { try await Task.sleep(nanoseconds: 1_000_000_000) } catch { return }
            }
        }
    }
    private func finishPresentation(_ ad: FullScreenPresentingAd) {
        guard let shown = presentedAd, (ad as AnyObject) === shown else { return }
        presentedAd = nil
        adPresenter = nil
        presentationWatchdog?.cancel()
        launch.finish()
        loadInterstitialIfNeeded()
    }
}

extension AdsManager: FullScreenContentDelegate {
    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        finishPresentation(ad)
    }
    func adWillPresentFullScreenContent(_ ad: FullScreenPresentingAd) {
        guard let shown = presentedAd, (ad as AnyObject) === shown else { return }
        policy.noteAdShown(at: Date().timeIntervalSince1970)
    }
    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) { finishPresentation(ad) }
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
