import Foundation
import XCTest
@testable import QuizzUpNativeCore

final class NativeRoundTimelineTests: XCTestCase {
    private let receipt = Date(timeIntervalSinceReferenceDate: 0)

    private func question(_ timing: [String: Double] = [:]) throws -> Question {
        var payload: [String: Any] = [
            "round": 1, "totalRounds": 6, "question": "Qui a marqué ?",
            "category": "football", "icon": "", "answers": ["A", "B", "C", "D"],
            "timeLimit": 10, "isBonus": false
        ]
        timing.forEach { payload[$0.key] = $0.value }
        return try JSONDecoder().decode(Question.self, from: JSONSerialization.data(withJSONObject: payload))
    }

    private func state(_ timeline: NativeRoundTimeline, after seconds: Double) -> (visible: Bool, open: Bool, seconds: Int) {
        timeline.state(at: receipt.addingTimeInterval(seconds))
    }

    func testQuestionOnlyReadingEndsBeforeAnswerInputOpens() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "presentationElapsedMs": 0,
            "answerOpensInMs": 2050, "remainingMs": 10000
        ]), receivedAt: receipt)

        XCTAssertFalse(state(timeline, after: 0).visible)
        XCTAssertFalse(state(timeline, after: 1.499).visible)
        XCTAssertTrue(state(timeline, after: 1.5).visible)
        XCTAssertFalse(state(timeline, after: 1.5).open)
        XCTAssertFalse(state(timeline, after: 2.049).open)
        XCTAssertTrue(state(timeline, after: 2.05).open)
    }

    func testReadingAndAnswerEntranceDoNotSpendAnswerBudget() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "answerOpensInMs": 2050, "remainingMs": 10000
        ]), receivedAt: receipt)

        for elapsed in [0.0, 0.8, 1.5, 2.049, 2.05] {
            XCTAssertEqual(state(timeline, after: elapsed).seconds, 10, "Budget changed before answer input at \(elapsed)s")
        }
        XCTAssertEqual(state(timeline, after: 3.10).seconds, 9)
        XCTAssertTrue(state(timeline, after: 12).open)
        XCTAssertFalse(state(timeline, after: 12.1).open)
        XCTAssertEqual(state(timeline, after: 12.1).seconds, 0)
    }

    func testReconnectDuringReadingUsesElapsedPresentation() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "presentationElapsedMs": 900,
            "answerOpensInMs": 1150, "remainingMs": 10000
        ]), receivedAt: receipt)

        XCTAssertFalse(state(timeline, after: 0.599).visible)
        XCTAssertTrue(state(timeline, after: 0.601).visible)
        XCTAssertFalse(state(timeline, after: 1.149).open)
        XCTAssertTrue(state(timeline, after: 1.151).open)
        XCTAssertEqual(state(timeline, after: 1.151).seconds, 10)
        XCTAssertEqual(state(timeline, after: 2.2).seconds, 9)
    }

    func testReconnectDuringAnsweringUsesRemainingMillisecondsWithoutRestart() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "presentationElapsedMs": 5000,
            "answerOpensInMs": 0, "remainingMs": 7350
        ]), receivedAt: receipt)

        XCTAssertTrue(state(timeline, after: 0).visible)
        XCTAssertTrue(state(timeline, after: 0).open)
        XCTAssertEqual(state(timeline, after: 0).seconds, 8)
        XCTAssertEqual(state(timeline, after: 0.36).seconds, 7)
        XCTAssertFalse(state(timeline, after: 7.36).open)
        XCTAssertEqual(state(timeline, after: 7.36).seconds, 0)
    }

    func testLegacyPayloadOpensImmediatelyWithFullBudget() throws {
        let timeline = NativeRoundTimeline(question: try question(), receivedAt: receipt)
        XCTAssertTrue(state(timeline, after: 0).visible)
        XCTAssertTrue(state(timeline, after: 0).open)
        XCTAssertEqual(state(timeline, after: 0).seconds, 10)
        XCTAssertEqual(state(timeline, after: 1.01).seconds, 9)
    }

    func testExpiredReconnectNeverReopensAnswerInput() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "presentationElapsedMs": 15000,
            "answerOpensInMs": 0, "remainingMs": 0
        ]), receivedAt: receipt)
        XCTAssertTrue(state(timeline, after: 0).visible)
        XCTAssertFalse(state(timeline, after: 0).open)
        XCTAssertFalse(state(timeline, after: 30).open)
        XCTAssertEqual(state(timeline, after: 0).seconds, 0)
    }

    func testRemainingBudgetCannotExceedTimeLimitOrBecomeNegative() throws {
        let tooLarge = NativeRoundTimeline(question: try question(["remainingMs": 50000]), receivedAt: receipt)
        XCTAssertEqual(state(tooLarge, after: 0).seconds, 10)
        let negative = NativeRoundTimeline(question: try question([
            "answerOpensInMs": -400, "remainingMs": -100
        ]), receivedAt: receipt)
        XCTAssertEqual(state(negative, after: 0).seconds, 0)
        XCTAssertFalse(state(negative, after: 0).open)
    }

    func testEarlierLocalDateDoesNotIncreaseRemainingTime() throws {
        let timeline = NativeRoundTimeline(question: try question([
            "readingMs": 1500, "answerOpensInMs": 2050, "remainingMs": 10000
        ]), receivedAt: receipt)
        XCTAssertEqual(state(timeline, after: -3).seconds, 10)
        XCTAssertFalse(state(timeline, after: -3).visible)
        XCTAssertFalse(state(timeline, after: -3).open)
    }

    func testLastFractionOfSecondRemainsVisibleUntilDeadline() throws {
        let timeline = NativeRoundTimeline(question: try question(["remainingMs": 250]), receivedAt: receipt)
        XCTAssertEqual(state(timeline, after: 0).seconds, 1)
        XCTAssertTrue(state(timeline, after: 0.249).open)
        XCTAssertEqual(state(timeline, after: 0.25).seconds, 0)
        XCTAssertFalse(state(timeline, after: 0.25).open)
    }
}
