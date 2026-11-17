import XCTest
@testable import QuizzUpNativeCore

final class NativeAvatarCatalogueTests: XCTestCase {
    func testAvatarPickersShareExactlyThreeStarters() {
        XCTAssertEqual(NativeAvatarCatalogue.starters.map(\.id), ["robot", "fox", "cat"])
        XCTAssertEqual(NativeAvatarCatalogue.starterSelection(for: "dragon"), "robot")
        XCTAssertEqual(NativeAvatarCatalogue.starterSelection(for: "🦊"), "fox")
    }

    func testExistingPaidPortraitsStillRender() {
        XCTAssertEqual(NativeAvatarCatalogue.portraitID(for: "dragon"), "dragon")
        XCTAssertEqual(NativeAvatarCatalogue.portraitID(for: "🐉"), "dragon")
    }
}
