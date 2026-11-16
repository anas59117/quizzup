import XCTest
@testable import QuizzUpNativeCore

final class NativeOnboardingTests: XCTestCase {
    private func state(_ status: NativeOnboardingState.Status = .pending, profile: Bool = true) -> NativeOnboardingState {
        .init(version: 1, status: status, rulesSeen: false, communitySeen: false, progressionSeen: false, profileComplete: profile)
    }

    func testOnlyNewAccountWithConfirmedProfileGetsInvitation() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "new", state: state(profile: false))
        XCTAssertFalse(session.showsWelcome)
        session.receive(state(), accountID: "new")
        XCTAssertTrue(session.showsWelcome)
        session.identify(accountID: "old", state: nil)
        XCTAssertFalse(session.showsWelcome)
        session.receive(state(.legacy), accountID: "old")
        XCTAssertFalse(session.offersContext)
    }

    func testSkipHidesImmediatelyWithoutInventingSavedStatus() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.skip)
        XCTAssertFalse(session.offersContext)
        XCTAssertEqual(session.server?.status, .pending)
        XCTAssertEqual(session.pending, [.skip])
        session.receive(state(.completed), accountID: "a")
        XCTAssertFalse(session.offersContext)
        XCTAssertEqual(session.pending, [.skip])
        session.receive(state(.skipped), accountID: "a")
        XCTAssertTrue(session.pending.isEmpty)
    }

    func testOldAccountAcknowledgementCannotChangeNewAccount() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.skip)
        session.identify(accountID: "b", state: state())
        session.receive(state(.skipped), accountID: "a")
        XCTAssertTrue(session.showsWelcome)
        XCTAssertTrue(session.pending.isEmpty)
    }

    func testReconnectRetainsUnacknowledgedSkipOnlyForItsAccount() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.skip)
        session.identify(accountID: "a", state: state())
        XCTAssertEqual(session.pending, [.skip])
        XCTAssertFalse(session.showsWelcome)
        session.identify(accountID: "b", state: state())
        XCTAssertTrue(session.showsWelcome)
    }

    func testMissingStateOnReconnectSuppressesHelpButRetainsUnsavedIntent() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.skip)
        session.identify(accountID: "a", state: nil)
        XCTAssertFalse(session.showsWelcome)
        XCTAssertEqual(session.pending, [.skip])
        XCTAssertNil(session.server)
    }

    func testCompletionLeavesOptionalContextAvailableAndSkipWinsLateCompletion() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.complete)
        XCTAssertFalse(session.showsWelcome)
        session.receive(state(.completed), accountID: "a")
        XCTAssertTrue(session.offersContext)
        session.receive(state(.skipped), accountID: "a")
        session.receive(state(.completed), accountID: "a")
        XCTAssertEqual(session.server?.status, .skipped)
        XCTAssertFalse(session.offersContext)
    }

    func testSeenAcknowledgementClearsOnlyConfirmedWrite() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state())
        session.request(.rules)
        session.request(.community)
        var confirmed = state()
        confirmed.rulesSeen = true
        session.receive(confirmed, accountID: "a")
        XCTAssertEqual(session.pending, [.community])
        XCTAssertFalse(session.needsRules)
        XCTAssertFalse(session.needsCommunity)
    }

    func testProfileCanBeConfirmedAfterAnAccountSkippedOnAnotherDevice() {
        var session = NativeOnboardingSession()
        session.identify(accountID: "a", state: state(.skipped, profile: false))
        session.receive(state(.skipped, profile: true), accountID: "a")
        XCTAssertTrue(session.server?.profileComplete == true)
        XCTAssertFalse(session.offersContext)
    }

    func testPracticeLocksFirstAnswerAndExpiresWithoutAwardingAnything() {
        let start = Date(timeIntervalSince1970: 100)
        var trial = NativePracticeRound(startedAt: start)
        XCTAssertEqual(trial.seconds(at: start), 10)
        trial.answer(1, at: start.addingTimeInterval(2))
        trial.answer(0, at: start.addingTimeInterval(3))
        XCTAssertEqual(trial.selected, 1)
        XCTAssertTrue(trial.correct)
        var expired = NativePracticeRound(startedAt: start)
        expired.answer(1, at: start.addingTimeInterval(11))
        XCTAssertNil(expired.selected)
        XCTAssertFalse(expired.correct)
        XCTAssertEqual(expired.seconds(at: start.addingTimeInterval(11)), 0)
    }
}
