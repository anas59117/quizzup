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

    func testNoAdRequestWhilePrivacyOrTrackingChoiceIsUnresolved() {
        XCTAssertFalse(NativeAdsPolicy.mayRequestAds(consent: true, premium: false,
            privacyBusy: true, trackingResolved: true))
        XCTAssertFalse(NativeAdsPolicy.mayRequestAds(consent: true, premium: false,
            privacyBusy: false, trackingResolved: false))
        XCTAssertTrue(NativeAdsPolicy.mayRequestAds(consent: true, premium: false,
            privacyBusy: false, trackingResolved: true))
    }

    func testDebugAndTestFlightNeverUseRevenueInventory() {
        XCTAssertTrue(NativeAdEnvironment.usesTestAds(debug: true, receiptName: nil))
        XCTAssertTrue(NativeAdEnvironment.usesTestAds(debug: false, receiptName: "sandboxReceipt"))
        XCTAssertFalse(NativeAdEnvironment.usesTestAds(debug: false, receiptName: "receipt"))
        XCTAssertFalse(NativeAdEnvironment.usesTestAds(debug: false, receiptName: nil))
    }

    func testAdvertisingIdentifiersMustBelongToTheSamePublisher() {
        let app = "ca-app-pub-8063787213241660~8267818819"
        let unit = "ca-app-pub-8063787213241660/1263426767"
        XCTAssertTrue(NativeAdEnvironment.validProductionIdentifiers(app: app, unit: unit))
        XCTAssertFalse(NativeAdEnvironment.validProductionIdentifiers(app: app,
            unit: "ca-app-pub-3940256099942544/4411468910"))
        XCTAssertFalse(NativeAdEnvironment.validProductionIdentifiers(app: app, unit: app))
        XCTAssertFalse(NativeAdEnvironment.validProductionIdentifiers(app: "", unit: unit))
    }

    func testPresentationCompletionMayReenterWithoutLosingTheNextIntent() {
        let gate = NativeAdContinuation()
        var starts = 0
        XCTAssertTrue(gate.begin {
            starts += 1
            XCTAssertTrue(gate.begin { starts += 1 })
        })
        gate.finish()
        XCTAssertTrue(gate.isPending)
        gate.finish()
        gate.finish()
        XCTAssertEqual(starts, 2)
    }
}
