import XCTest
@testable import QuizzUpNativeCore

final class NativeAudioPolicyTests: XCTestCase {
    func testMutingAndBackgroundingSuppressMusicWithoutLosingTheDuelContext() {
        var policy = NativeAudioPolicy()
        policy.desired = .search
        XCTAssertEqual(policy.playableCue, .search)
        policy.muted = true
        XCTAssertNil(policy.playableCue)
        policy.desired = .duel
        XCTAssertNil(policy.playableCue)
        policy.muted = false
        XCTAssertEqual(policy.playableCue, .duel)
        policy.foreground = false
        XCTAssertNil(policy.playableCue)
        policy.foreground = true
        policy.interrupted = true
        XCTAssertNil(policy.playableCue)
        policy.interrupted = false
        XCTAssertEqual(policy.playableCue, .duel)
        policy.desired = nil
        XCTAssertNil(policy.playableCue)
    }

    func testConfirmedFeedbackPlaysOnceAndMutedEventsAreNeverReplayed() {
        var policy = NativeAudioPolicy()
        policy.desired = .duel
        let correct = NativeAnswerFeedback(correct: true)
        XCTAssertEqual(policy.consume(correct), .correct)
        XCTAssertNil(policy.consume(correct))
        let wrong = NativeAnswerFeedback(correct: false)
        XCTAssertEqual(policy.consume(wrong), .wrong)
        policy.muted = true
        let silent = NativeAnswerFeedback(correct: true)
        XCTAssertNil(policy.consume(silent))
        policy.muted = false
        XCTAssertNil(policy.consume(silent))
        policy.foreground = false
        let background = NativeAnswerFeedback(correct: false)
        XCTAssertNil(policy.consume(background))
        policy.foreground = true
        XCTAssertNil(policy.consume(background))
        policy.desired = .search
        XCTAssertNil(policy.consume(NativeAnswerFeedback(correct: true)))
    }
}
