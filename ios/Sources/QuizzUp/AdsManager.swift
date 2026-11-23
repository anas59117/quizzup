import Foundation

/// App Store 1.0 ships without advertising SDKs or tracking requests.
/// Preserve the game launch hooks so unavailable ads never delay gameplay.
@MainActor
final class AdsManager {
    static let shared = AdsManager()
    var isPremium = false
    var presentationAllowed: () -> Bool = { false }

    func start() {}
    func sceneBecameActive() {}
    func noteMatchFinished(id: String) {}
    func requestTrackingAuthorizationIfNeeded() {}
    func maybePresent(then: @escaping () -> Void) { then() }
}
