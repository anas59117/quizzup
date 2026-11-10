import Foundation
import XCTest
@testable import QuizzUpNativeCore

final class NativeSocialPayloadTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try JSONDecoder().decode(type, from: Data(json.utf8))
    }

    func testDirectMessageUsesNumericMillisecondsSinceEpoch() throws {
        let message = try decode(NativeMessage.self, #"{"id":"msg_123","fromId":"alice","toId":"bob","kind":"text","text":"On joue ?","createdAt":1788163200123}"#)
        XCTAssertEqual(message.id, "msg_123")
        XCTAssertEqual(message.text, "On joue ?")
        XCTAssertEqual(message.createdAt, 1788163200123)
        XCTAssertEqual(message.date.timeIntervalSince1970, 1788163200.123, accuracy: 0.00001)
        XCTAssertNil(message.challenge)
        XCTAssertNil(message.clientMessageId)
    }

    func testDecimalMillisecondsRetainSubsecondPrecision() throws {
        let message = try decode(NativeMessage.self, #"{"id":"msg_1","fromId":"alice","toId":"bob","kind":"text","text":"Salut","createdAt":1788163200123.5,"clientMessageId":"local_42"}"#)
        XCTAssertEqual(message.date.timeIntervalSince1970, 1788163200.1235, accuracy: 0.00001)
        XCTAssertEqual(message.clientMessageId, "local_42")
    }

    func testISODateStringIsNotSilentlyMisreadAsMilliseconds() {
        XCTAssertThrowsError(try decode(NativeMessage.self, #"{"id":"msg_1","fromId":"alice","toId":"bob","kind":"text","text":"Salut","createdAt":"2026-08-31T08:00:00Z"}"#))
    }

    func testConversationPreservesUnreadCountAndPeerPresence() throws {
        let conversation = try decode(NativeConversation.self, #"{"peer":{"id":"bob","name":"Benoît","avatar":"wolf","online":true},"lastMessage":{"id":"msg_123","fromId":"bob","toId":"alice","kind":"text","text":"À bientôt","createdAt":1788163200123},"unread":3}"#)
        XCTAssertEqual(conversation.id, "bob")
        XCTAssertEqual(conversation.peer.name, "Benoît")
        XCTAssertEqual(conversation.peer.online, true)
        XCTAssertEqual(conversation.lastMessage.fromId, "bob")
        XCTAssertEqual(conversation.unread, 3)
    }

    func testFriendWithoutPresenceKeepsUnknownStatusOptional() throws {
        let friend = try decode(NativeFriend.self, #"{"id":"bob","name":"Benoît","avatar":"wolf"}"#)
        XCTAssertEqual(friend.id, "bob")
        XCTAssertNil(friend.online)
        let offline = try decode(NativeFriend.self, #"{"id":"bob","name":"Benoît","avatar":"wolf","online":false}"#)
        XCTAssertEqual(offline.online, false)
    }

    func testChallengeMessagePreservesModeAndInvitationStatus() throws {
        let message = try decode(NativeMessage.self, #"{"id":"msg_duel","fromId":"alice","toId":"bob","kind":"challenge","text":"Un duel sur Harry Potter ?","createdAt":1788163200123,"challenge":{"id":"challenge_7","fromId":"alice","toId":"bob","category":"harry_potter","status":"pending","mode":"live"}}"#)
        let challenge = try XCTUnwrap(message.challenge)
        XCTAssertEqual(message.kind, "challenge")
        XCTAssertEqual(challenge.id, "challenge_7")
        XCTAssertEqual(challenge.category, "harry_potter")
        XCTAssertEqual(challenge.status, "pending")
        XCTAssertEqual(challenge.mode, "live")
    }

    func testLegacyChallengeWithoutModeAndTopicProgressDecode() throws {
        let challenge = try decode(NativeChallenge.self, #"{"id":"challenge_7","fromId":"alice","toId":"bob","category":"minecraft","status":"accepted"}"#)
        XCTAssertNil(challenge.mode)
        XCTAssertEqual(challenge.status, "accepted")
        let topic = try decode(NativeTopicProgress.self, #"{"key":"minecraft","level":4,"updatedAt":1788163200123}"#)
        XCTAssertEqual(topic.id, "minecraft")
        XCTAssertEqual(topic.level, 4)
        XCTAssertNil(topic.completion)
        XCTAssertNil(topic.bestStreak)
    }

    func testTopicProgressDecodesDetailStatistics() throws {
        let topic = try decode(NativeTopicProgress.self, #"{"key":"minecraft","level":4,"completion":27,"bestStreak":6}"#)
        XCTAssertEqual(topic.completion, 27)
        XCTAssertEqual(topic.bestStreak, 6)
    }

    func testFeedUpdateKeepsUnscopedHomePostSeparateFromFilteredPosts() throws {
        let post = try decode(NativeCommunityPost.self, #"{"id":"p_1","authorId":"alice","authorName":"Alice","authorAvatar":"robot","authorFollowed":false,"category":"minecraft","text":"On joue ?","mediaUrl":null,"question":{"prompt":"Quelle pierre ?","answers":["Or","Fer","Cuivre","Diamant"]},"reactions":3,"reacted":true,"commentsCount":1,"createdAt":1788163200123}"#)
        var state = NativeCommunityState()
        state.filter = .init(category: "harry_potter")
        state.loading = true
        state.receiveFeed([post], filter: .init())
        XCTAssertTrue(state.posts.isEmpty)
        XCTAssertTrue(state.loading)
        XCTAssertEqual(state.latestPost?.id, post.id)
        XCTAssertEqual(state.latestPost?.question?.answers.count, 4)

        state.receiveFeed([], filter: .init(category: "harry_potter"))
        XCTAssertFalse(state.loading)
        XCTAssertEqual(state.latestPost?.id, post.id)
    }
}
