import Foundation
import XCTest
@testable import QuizzUpNativeCore

final class NativeProfileProgressionTests: XCTestCase {
    private let legacy = #"{"finalScore":118,"won":true,"tie":false,"others":[],"leaderboard":[],"reason":"complete","coins":50,"xp":258,"xpBreakdown":{"matchScore":118,"finishBonus":40,"winBonus":100,"xpTotal":258},"stats":{"games":27,"wins":16,"streak":2,"xp":6090,"level":5,"xpIntoLevel":90,"xpForLevel":3000}}"#

    func testLegacyResultNeedsNoBeforeSnapshot() throws {
        let result = try JSONDecoder().decode(GameEnd.self, from: Data(legacy.utf8))
        XCTAssertNil(result.progressionBefore)
        XCTAssertEqual(result.stats?.level, 5)
    }

    func testLevelUpUsesAuthoritativeSnapshotEvenWhenRewardDoesNotImplyThreshold() throws {
        let json = String(legacy.dropLast()) + #", "progressionBefore":{"level":4,"xpIntoLevel":2232,"xpForLevel":2400}}"#
        let result = try JSONDecoder().decode(GameEnd.self, from: Data(json.utf8))
        XCTAssertEqual(result.progressionBefore?.level, 4)
        XCTAssertEqual(try XCTUnwrap(result.progressionBefore).fraction, 0.93, accuracy: 0.0001)
        XCTAssertEqual(result.stats?.xpIntoLevel, 90)
        XCTAssertEqual(result.stats?.xpForLevel, 3000)
    }

    func testProgressFractionClampsMalformedAndZeroGoals() {
        XCTAssertEqual(NativeProgressionSnapshot(level: 1, xpIntoLevel: 10, xpForLevel: 0).fraction, 0)
        XCTAssertEqual(NativeProgressionSnapshot(level: 1, xpIntoLevel: -5, xpForLevel: 600).fraction, 0)
        XCTAssertEqual(NativeProgressionSnapshot(level: 1, xpIntoLevel: 900, xpForLevel: 600).fraction, 1)
    }

    func testMineFeedIgnoresLateAllFeedAndDoesNotReplaceHomePreview() throws {
        let post = try JSONDecoder().decode(NativeCommunityPost.self, from: Data(#"{"id":"mine","authorId":"me","authorName":"Alex","authorAvatar":"fox","authorFollowed":false,"text":"My quiz","reactions":0,"reacted":false,"commentsCount":0,"createdAt":1}"#.utf8))
        var state = NativeCommunityState()
        state.filter = .init(mine: true)
        state.loading = true
        state.receiveFeed([post], filter: .init())
        XCTAssertTrue(state.posts.isEmpty)
        XCTAssertTrue(state.loading)
        state.receiveFeed([post], filter: .init(mine: true))
        XCTAssertEqual(state.posts.map(\.id), ["mine"])
        XCTAssertFalse(state.loading)
        state.receiveFeed([], filter: .init(mine: true))
        XCTAssertEqual(state.latestPost?.id, "mine", "Personal refresh must not erase the home community preview")
    }
    func testMineScopeAndLiveEventsNeverIncludeAnotherAuthorOrOfficialPost() throws {
        func post(author: String?) throws -> NativeCommunityPost {
            let authorField = author.map { "\"authorId\":\"\($0)\"," } ?? ""
            return try JSONDecoder().decode(NativeCommunityPost.self, from: Data("{\(authorField)\"id\":\"p\",\"authorName\":\"Alex\",\"authorAvatar\":\"fox\",\"authorFollowed\":false,\"category\":\"marvel\",\"text\":\"My quiz\",\"reactions\":0,\"reacted\":false,\"commentsCount\":0,\"createdAt\":1}".utf8))
        }
        let filter = NativeCommunityFilter(mine: true)
        XCTAssertEqual(filter.scope, "mine")
        XCTAssertEqual(NativeCommunityFilter().scope, "all")
        XCTAssertTrue(filter.includesLivePost(try post(author: "me"), clientID: "me"))
        XCTAssertFalse(filter.includesLivePost(try post(author: "other"), clientID: "me"))
        XCTAssertFalse(filter.includesLivePost(try post(author: nil), clientID: "me"))
        XCTAssertFalse(filter.includesLivePost(try post(author: nil), clientID: nil))
        XCTAssertFalse(NativeCommunityFilter(category: "minecraft", mine: true).includesLivePost(try post(author: "me"), clientID: "me"))
        XCTAssertFalse(NativeCommunityFilter(following: true).includesLivePost(try post(author: "me"), clientID: "me"))
    }

    func testLeavingPersonalFeedPreservesPublicPreviewAndRejectsLateMineResponse() throws {
        func post(_ id: String) throws -> NativeCommunityPost {
            try JSONDecoder().decode(NativeCommunityPost.self, from: Data("{\"id\":\"\(id)\",\"authorName\":\"Alex\",\"authorAvatar\":\"fox\",\"authorFollowed\":false,\"text\":\"Quiz\",\"reactions\":0,\"reacted\":false,\"commentsCount\":0,\"createdAt\":1}".utf8))
        }
        let publicPost = try post("public")
        let ownPost = try post("own")
        var state = NativeCommunityState()
        state.receiveFeed([publicPost], filter: .init())
        state.filter = .init(mine: true)
        state.receiveFeed([ownPost], filter: .init(mine: true))
        state.loading = true
        let personalAttempt = state.listAttempt

        XCTAssertTrue(state.leavePersonalFeed())
        XCTAssertEqual(state.filter, NativeCommunityFilter())
        XCTAssertTrue(state.posts.isEmpty)
        XCTAssertFalse(state.loading)
        XCTAssertNotEqual(state.listAttempt, personalAttempt)
        XCTAssertEqual(state.latestPost?.id, "public")

        state.receiveFeed([ownPost], filter: .init(mine: true))
        XCTAssertTrue(state.posts.isEmpty)
        XCTAssertEqual(state.latestPost?.id, "public")
        state.receiveFeed([publicPost], filter: .init())
        XCTAssertEqual(state.posts.map(\.id), ["public"])
        XCTAssertFalse(state.leavePersonalFeed())
        XCTAssertEqual(state.posts.map(\.id), ["public"])
    }

}
