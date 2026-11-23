import Foundation
import SwiftUI

// Single source of truth for "is the current user a paying Premium
// subscriber?". The ads layer, any upsell surfaces, and the server-side
// perks all read from here. Today it's a persistent flag that defaults
// to `false`; tomorrow this is where StoreKit 2's Transaction.currentEntitlements
// is observed and the receipt is validated.
//
// Keeping the type stable now means the AdsManager wiring, the "retirer
// les pubs" marketing copy, and any future Premium toggles in Settings
// never have to be re-threaded when the subscription SKU goes live.
@MainActor
final class PremiumStatus: ObservableObject {

    private let storageKey = "quizzup.premium.isActive"

    @Published private(set) var isPremium: Bool

    init() {
        self.isPremium = UserDefaults.standard.bool(forKey: storageKey)
    }

    /// Flip the cached state. The AdsManager reacts via `onChange`
    /// in `QuizzUpApp`, so flipping this at any time silences / unsilences
    /// ads without a relaunch.
    func setPremium(_ value: Bool) {
        guard value != isPremium else { return }
        isPremium = value
        UserDefaults.standard.set(value, forKey: storageKey)
    }
}
