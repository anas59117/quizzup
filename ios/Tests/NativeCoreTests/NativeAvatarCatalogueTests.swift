import XCTest
@testable import QuizzUpNativeCore

final class NativeAvatarCatalogueTests: XCTestCase {
    func testSignupOffersExactlyThreeFreeStarters() {
        XCTAssertEqual(NativeAvatarCatalogue.starters.map(\.id), ["robot", "fox", "cat"])
        XCTAssertEqual(NativeAvatarCatalogue.starterSelection(for: "dragon"), "robot")
        XCTAssertEqual(NativeAvatarCatalogue.starterSelection(for: "🦊"), "fox")
    }

    func testProfileShowsPricesUntilTheServerReportsOwnership() throws {
        XCTAssertEqual(NativeAvatarCatalogue.options.count, 10)
        let cat = try XCTUnwrap(NativeAvatarCatalogue.options.first { $0.id == "cat" })
        XCTAssertNil(cat.lockedPrice(owned: []))
        let dragon = try XCTUnwrap(NativeAvatarCatalogue.options.first { $0.id == "dragon" })
        XCTAssertEqual(dragon.lockedPrice(owned: []), 600)
        XCTAssertNil(dragon.lockedPrice(owned: ["dragon"]))
    }
}
