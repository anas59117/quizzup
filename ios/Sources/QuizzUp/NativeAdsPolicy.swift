import Foundation

/// Persistent cadence, independent of UI appearances and ad inventory.
struct NativeAdsPolicy {
    let defaults: UserDefaults
    private let countKey = "quizzup.ads.matchesSinceLastAd"
    private let shownKey = "quizzup.ads.lastAdShownAt"
    private let idsKey = "quizzup.ads.completedMatchIDs"
    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    func noteCompletedMatch(id: String) {
        var ids = defaults.stringArray(forKey: idsKey) ?? []
        guard !ids.contains(id) else { return }
        ids.append(id)
        defaults.set(Array(ids.suffix(100)), forKey: idsKey)
        defaults.set(defaults.integer(forKey: countKey) + 1, forKey: countKey)
    }
    func isDue(at now: TimeInterval) -> Bool {
        guard defaults.integer(forKey: countKey) >= 4 else { return false }
        let last = defaults.double(forKey: shownKey)
        return last == 0 || now - last >= 180
    }
    func noteAdShown(at now: TimeInterval) {
        defaults.set(now, forKey: shownKey)
        defaults.set(0, forKey: countKey)
    }
    static func mayRequestAds(consent: Bool, premium: Bool) -> Bool { consent && !premium }
}

/// Owns one launch intention until dismissal OR failure, never both.
final class NativeAdContinuation {
    private var continuation: (() -> Void)?
    var isPending: Bool { continuation != nil }
    @discardableResult func begin(_ action: @escaping () -> Void) -> Bool {
        guard continuation == nil else { return false }
        continuation = action
        return true
    }
    func finish() {
        let action = continuation
        continuation = nil
        action?()
    }
}
