import XCTest
@testable import QuizzUpNativeCore

final class NativeAudioPolicyTests: XCTestCase {
    func testVictoryPlaysOnceAfterTheDuelMusicStops() {
        var policy = NativeAudioPolicy()
        policy.desired = nil
        let win = NativeVictoryFeedback(won: true, tie: false, solo: false)
        XCTAssertEqual(policy.consume(win), .victory)
        XCTAssertNil(policy.consume(win))
        XCTAssertEqual(policy.consume(NativeVictoryFeedback(won: true, tie: false, solo: false)), .victory)
    }

    func testDefeatTieAndSoloNeverCelebrateAVictory() {
        var policy = NativeAudioPolicy()
        XCTAssertNil(policy.consume(NativeVictoryFeedback(won: false, tie: false, solo: false)))
        XCTAssertNil(policy.consume(NativeVictoryFeedback(won: true, tie: true, solo: false)))
        XCTAssertNil(policy.consume(NativeVictoryFeedback(won: true, tie: false, solo: true)))
    }

    func testSilentVictoriesAreConsumedWithoutBeingReplayedLater() {
        var policy = NativeAudioPolicy()
        for state in 0..<3 {
            policy.muted = state == 0
            policy.foreground = state != 1
            policy.interrupted = state == 2
            let win = NativeVictoryFeedback(won: true, tie: false, solo: false)
            XCTAssertNil(policy.consume(win))
            policy.muted = false; policy.foreground = true; policy.interrupted = false
            XCTAssertNil(policy.consume(win))
            XCTAssertEqual(policy.consume(NativeVictoryFeedback(won: true, tie: false, solo: false)), .victory)
        }
    }

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
