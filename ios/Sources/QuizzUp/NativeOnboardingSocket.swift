import Foundation

@MainActor
extension GameSocket {
    private func onboardingKey(_ accountID: String) -> String { "quizzup.onboardingPending.\(accountID)" }

    func identifyOnboarding(_ object: [String: Any]) {
        guard let clientId else { return }
        let restored = Set((UserDefaults.standard.stringArray(forKey: onboardingKey(clientId)) ?? [])
            .compactMap(NativeOnboardingAction.init(rawValue:)))
        onboarding.identify(accountID: clientId, state: decode(object["onboarding"], as: NativeOnboardingState.self), restored: restored)
        onboardingLaunch = nil
        onboardingSyncError = nil
        if stage == .finished, result?.reason == "complete" {
            completeWelcomeAfterRealGame()
            onboardingProgressionVisible = onboarding.needsProgression
        }
        flushOnboarding()
    }

    func onboardingUpdateFailed(_ object: [String: Any]) {
        guard (object["clientId"] as? String).map({ $0 == clientId }) ?? false else { return }
        onboardingSyncError = lang == "fr" ? "Choix non enregistré. Nouvelle tentative à la reconnexion." : "Choice not saved. Retrying when reconnected."
    }

    func receiveOnboarding(_ object: [String: Any]) {
        let sender = object["clientId"] as? String ?? (object["profile"] as? [String: Any])?["id"] as? String
        guard let clientId, onboarding.accountID == clientId, sender == clientId,
              let state = decode(object["onboarding"], as: NativeOnboardingState.self) else { return }
        onboarding.receive(state, accountID: clientId)
        onboardingSyncError = nil
        persistOnboardingIntents()
    }

    func updateOnboarding(_ action: NativeOnboardingAction) {
        onboarding.request(action)
        if action == .skip { onboardingLaunch = nil; onboardingProgressionVisible = false }
        persistOnboardingIntents()
        flushOnboarding()
    }

    func flushOnboarding() {
        guard connected, onboarding.accountID == clientId else { return }
        for action in NativeOnboardingAction.allCases where onboarding.pending.contains(action) {
            _ = send(["type": "onboarding_update", "action": action.rawValue])
        }
    }

    private func persistOnboardingIntents() {
        guard let accountID = onboarding.accountID else { return }
        UserDefaults.standard.set(onboarding.pending.map(\.rawValue).sorted(), forKey: onboardingKey(accountID))
    }

    func offerOnboardingRules(category: String?, solo: Bool) -> Bool {
        guard onboarding.needsRules else { return false }
        onboardingLaunch = NativeOnboardingLaunch(category: category, solo: solo)
        return true
    }

    func queuePlaySheetLaunch(category: String?, solo: Bool) {
        guard !isStarting else { return }
        pendingPlaySheetLaunch = NativePlaySheetIntent(accountID: clientId,
            launch: NativeOnboardingLaunch(category: category, solo: solo))
    }

    func completeWelcomeAfterRealGame() {
        if onboarding.showsWelcome { updateOnboarding(.complete) }
    }

    /// Called by the presenting sheet's onDismiss, after its presentation ends.
    func completePlaySheetDismissal() {
        guard let intent = pendingPlaySheetLaunch else { return }
        pendingPlaySheetLaunch = nil
        guard intent.accountID == clientId, stage == .home, !isStarting else { return }
        soloMode = intent.launch.solo
        if let category = intent.launch.category { startWithCategory(category) }
        else { quickMatch() }
    }

    func beginOnboardingMatch() {
        guard let launch = onboardingLaunch else { return }
        updateOnboarding(.rules)
        onboardingLaunch = nil
        soloMode = launch.solo
        if let category = launch.category { startWithCategory(category) } else { quickMatch() }
    }
}
