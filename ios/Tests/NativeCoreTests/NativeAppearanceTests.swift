import XCTest
@testable import QuizzUpNativeCore

final class NativeAppearanceTests: XCTestCase {
    func testStoredChoiceRestoresAndInvalidValuesFollowTheSystem() {
        XCTAssertEqual(NativeAppearance.stored("light"), .light)
        XCTAssertEqual(NativeAppearance.stored("dark"), .dark)
        XCTAssertEqual(NativeAppearance.stored("system"), .system)
        XCTAssertEqual(NativeAppearance.stored(nil), .system)
        XCTAssertEqual(NativeAppearance.stored("broken"), .system)
    }

    func testManualChoicesOverrideOppositeDeviceAppearance() {
        XCTAssertEqual(NativeAppearance.light.explicitDark, false)
        XCTAssertEqual(NativeAppearance.dark.explicitDark, true)
        XCTAssertFalse(NativeAppearance.light.resolvedDark(systemDark: true))
        XCTAssertTrue(NativeAppearance.dark.resolvedDark(systemDark: false))
    }

    func testAutomaticRemainsUnforcedAndFollowsBothSystemStates() {
        XCTAssertNil(NativeAppearance.system.explicitDark)
        XCTAssertFalse(NativeAppearance.system.resolvedDark(systemDark: false))
        XCTAssertTrue(NativeAppearance.system.resolvedDark(systemDark: true))
    }
}
