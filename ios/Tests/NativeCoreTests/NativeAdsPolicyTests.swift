import XCTest
@testable import QuizzUpNativeCore

final class NativeAdsPolicyTests: XCTestCase {
    func testOnlyFourDistinctCompletedGamesMakeAnAdDue() {
        let defaults = UserDefaults(suiteName: UUID().uuidString)!
        var policy = NativeAdsPolicy(defaults: defaults)
        for id in 1...3 {
            policy.noteCompletedMatch(id: "game-\(id)")
            XCTAssertFalse(policy.isDue(at: 1000))
        }
        policy.noteCompletedMatch(id: "game-3")
        XCTAssertFalse(policy.isDue(at: 1000))
        policy.noteCompletedMatch(id: "game-4")
        XCTAssertTrue(policy.isDue(at: 1000))
        // Leaving results, restarting and unavailable inventory do not consume a slot.
        policy = NativeAdsPolicy(defaults: defaults)
        XCTAssertTrue(policy.isDue(at: 1000))
        policy.noteCompletedMatch(id: "game-4")
        policy.noteAdShown(at: 1000)
        XCTAssertFalse(policy.isDue(at: 2000))
        for id in 5...8 { policy.noteCompletedMatch(id: "game-\(id)") }
        XCTAssertFalse(policy.isDue(at: 1179))
        XCTAssertTrue(policy.isDue(at: 1180))
        XCTAssertFalse(policy.isDue(at: 999))
    }

    func testConsentPremiumAndInventoryNeverBlockGameplay() {
        XCTAssertFalse(NativeAdsPolicy.mayRequestAds(consent: false, premium: false))
        XCTAssertFalse(NativeAdsPolicy.mayRequestAds(consent: true, premium: true))
        XCTAssertTrue(NativeAdsPolicy.mayRequestAds(consent: true, premium: false))
        let gate = NativeAdContinuation()
        var starts = 0
        XCTAssertTrue(gate.begin { starts += 1 })
        XCTAssertFalse(gate.begin { starts += 100 })
        gate.finish()
        gate.finish() // Duplicate SDK dismissal/failure callback.
        XCTAssertEqual(starts, 1)
        XCTAssertTrue(gate.begin { starts += 1 })
        gate.finish()
        XCTAssertEqual(starts, 2)
    }
}
