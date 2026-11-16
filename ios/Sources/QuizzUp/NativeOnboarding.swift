import Foundation

/// Private account-owned state. Only server acknowledgements change this value.
struct NativeOnboardingState: Codable, Equatable {
    enum Status: String, Codable { case pending, skipped, completed, legacy }
    var version: Int
    var status: Status
    var rulesSeen: Bool
    var communitySeen: Bool
    var progressionSeen: Bool
    var profileComplete: Bool
}

enum NativeOnboardingAction: String, Codable, CaseIterable {
    case skip, complete, rules, community, progression
}

/// Pending intents dismiss help responsively; they never masquerade as saved state.
struct NativeOnboardingSession {
    private(set) var accountID: String?
    private(set) var server: NativeOnboardingState?
    private(set) var pending: Set<NativeOnboardingAction> = []

    var offersContext: Bool {
        guard let server, server.version == 1, server.profileComplete,
              server.status == .pending || server.status == .completed else { return false }
        return !pending.contains(.skip)
    }
    var showsWelcome: Bool { offersContext && server?.status == .pending && !pending.contains(.complete) }
    var needsRules: Bool { offersContext && server?.rulesSeen == false && !pending.contains(.rules) }
    var needsCommunity: Bool { offersContext && server?.communitySeen == false && !pending.contains(.community) }
    var needsProgression: Bool { offersContext && server?.progressionSeen == false && !pending.contains(.progression) }

    mutating func identify(accountID: String, state: NativeOnboardingState?, restored: Set<NativeOnboardingAction> = []) {
        if self.accountID != accountID {
            self = NativeOnboardingSession()
            self.accountID = accountID
            pending = restored
        }
        if let state { receive(state, accountID: accountID) }
        else { server = nil }
    }

    mutating func request(_ action: NativeOnboardingAction) {
        guard offersContext else { return }
        if action == .skip { pending = [.skip] }
        else { pending.insert(action) }
    }

    mutating func receive(_ state: NativeOnboardingState, accountID: String) {
        guard self.accountID == accountID, state.version == 1 else { return }
        // A delayed completion acknowledgement cannot undo a terminal skip.
        if server?.status == .skipped && state.status != .skipped { return }
        server = state
        if state.status == .skipped || state.status == .legacy { pending = []; return }
        if state.status == .completed { pending.remove(.complete) }
        if state.rulesSeen { pending.remove(.rules) }
        if state.communitySeen { pending.remove(.community) }
        if state.progressionSeen { pending.remove(.progression) }
    }
}

/// Deliberately independent of sockets, scores, XP and account statistics.
struct NativePracticeRound {
    let startedAt: Date
    private(set) var selected: Int?
    var correct: Bool { selected == 1 }
    func seconds(at date: Date) -> Int { max(0, min(10, Int(ceil(10 - date.timeIntervalSince(startedAt))))) }
    mutating func answer(_ index: Int, at date: Date) {
        guard selected == nil, seconds(at: date) > 0, (0..<4).contains(index) else { return }
        selected = index
    }
}

struct NativeOnboardingLaunch: Identifiable {
    let id = UUID()
    let category: String?
    let solo: Bool
    var manual = false
    var initialPractice = false
}

struct NativePlaySheetIntent {
    let accountID: String?
    let launch: NativeOnboardingLaunch
}
