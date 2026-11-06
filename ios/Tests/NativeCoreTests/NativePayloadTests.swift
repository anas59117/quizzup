import Foundation
import XCTest
@testable import QuizzUpNativeCore

final class NativePayloadTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try JSONDecoder().decode(type, from: Data(json.utf8))
    }

    func testGameStartOpponentOmitsScoreAndAnswerState() throws {
        let opponent = try decode(Opponent.self, #"{"id":"socket_42","name":"Anaïs","avatar":"owl","clientId":"player_7"}"#)
        XCTAssertEqual(opponent.id, "socket_42")
        XCTAssertEqual(opponent.clientId, "player_7")
        XCTAssertEqual(opponent.name, "Anaïs")
        XCTAssertEqual(opponent.score, 0)
        XCTAssertFalse(opponent.answered)
        XCTAssertFalse(opponent.correct)
    }

    func testLegacyOpponentAllowsMissingClientIdentifierAndNullDefaults() throws {
        let opponent = try decode(Opponent.self, #"{"id":"bot_1","name":"Léo","avatar":"fox","score":null,"answered":null,"correct":null}"#)
        XCTAssertNil(opponent.clientId)
        XCTAssertEqual(opponent.score, 0)
        XCTAssertFalse(opponent.answered)
        XCTAssertFalse(opponent.correct)
    }

    func testScoredOpponentPreservesServerAnswerState() throws {
        let opponent = try decode(Opponent.self, #"{"id":"socket_42","name":"Anaïs","avatar":"owl","score":875,"answered":true,"correct":true}"#)
        XCTAssertEqual(opponent.score, 875)
        XCTAssertTrue(opponent.answered)
        XCTAssertTrue(opponent.correct)
    }

    func testQuestionWithoutPhotoOrTimingRemainsPlayable() throws {
        let question = try decode(Question.self, #"{"round":2,"totalRounds":6,"question":"Dans quel pays ?","category":"culture","icon":"","answers":["France","Italie","Japon","Brésil"],"timeLimit":10,"isBonus":false}"#)
        XCTAssertEqual(question.question, "Dans quel pays ?")
        XCTAssertEqual(question.answers.count, 4)
        XCTAssertNil(question.image)
        XCTAssertNil(question.credit)
        XCTAssertNil(question.readingMs)
        XCTAssertNil(question.presentationElapsedMs)
        XCTAssertNil(question.answerOpensInMs)
        XCTAssertNil(question.remainingMs)
    }

    func testPhotoQuestionPreservesCreditAndServerTimingMetadata() throws {
        let question = try decode(Question.self, #"{"round":6,"totalRounds":6,"question":"Quel joueur ?","category":"football","icon":"","answers":["A","B","C","D"],"timeLimit":15,"isBonus":true,"image":"/images/players/sample.webp","credit":"Photo: Wikimedia Commons","readingMs":1500,"presentationElapsedMs":250,"answerOpensInMs":1800,"remainingMs":15000,"answerStaggerMs":110,"answerEnterMs":220}"#)
        XCTAssertTrue(question.isBonus)
        XCTAssertEqual(question.image, "/images/players/sample.webp")
        XCTAssertEqual(question.credit, "Photo: Wikimedia Commons")
        XCTAssertEqual(question.readingMs, 1500)
        XCTAssertEqual(question.presentationElapsedMs, 250)
        XCTAssertEqual(question.answerOpensInMs, 1800)
        XCTAssertEqual(question.remainingMs, 15000)
        XCTAssertEqual(question.timeLimit, 15)
    }

    func testQuestionRequiresServerQuestionFieldRatherThanTextAlias() {
        XCTAssertThrowsError(try decode(Question.self, #"{"round":1,"totalRounds":6,"text":"Wrong field","category":"culture","icon":"","answers":["A","B"],"timeLimit":10,"isBonus":false}"#))
    }

    func testUnansweredRoundResultPreservesNullAnswer() throws {
        let result = try decode(RoundResult.self, #"{"round":1,"correctIndex":2,"yourAnswer":null,"yourCorrect":false,"pointsEarned":0,"yourScore":0,"others":[{"id":"peer_1","answered":true,"correct":true}]}"#)
        XCTAssertNil(result.yourAnswer)
        XCTAssertEqual(result.correctIndex, 2)
        XCTAssertEqual(result.others.first?.id, "peer_1")
        XCTAssertEqual(result.others.first?.correct, true)
    }

    func testFinishedGameWithoutAccountStatsStillDecodes() throws {
        let result = try decode(GameEnd.self, #"{"finalScore":1300,"won":true,"tie":false,"others":[{"id":"peer_1","name":"Noa","avatar":"fox","score":900}],"leaderboard":[{"id":"me","name":"Anaïs","avatar":"owl","score":1300}],"reason":"completed","coins":20,"xp":1450,"xpBreakdown":{"matchScore":1300,"finishBonus":100,"winBonus":50,"xpTotal":1450}}"#)
        XCTAssertNil(result.stats)
        XCTAssertTrue(result.won)
        XCTAssertEqual(result.xpBreakdown.xpTotal, 1450)
        XCTAssertEqual(result.others.first?.score, 900)
        XCTAssertNil(result.others.first?.clientId)
        XCTAssertEqual(result.leaderboard.first?.id, "me")
    }

    func testCategoryIdentityUsesStableBackendKey() throws {
        let category = try decode(Category.self, #"{"key":"harry_potter","label":"Harry Potter","icon":"","count":150}"#)
        XCTAssertEqual(category.id, "harry_potter")
        XCTAssertEqual(category.count, 150)
    }
}
