import Foundation
import XCTest
@testable import QuizzUpNativeCore

final class NativeEmailSignInLinkTests: XCTestCase {
    private let origin = "https://quizzup-ae633.firebaseapp.com"

    func testAcceptsDirectAndFirebaseHostingLinks() throws {
        let action = try XCTUnwrap(URL(string: "\(origin)/__/auth/action?mode=signIn&oobCode=test-code"))
        XCTAssertEqual(NativeEmailSignInLink.actionURL(from: action), action)
        XCTAssertEqual(NativeEmailSignInLink.actionURL(from: try wrap(action)), action)
    }

    func testRejectsForeignHostsAndOtherFirebaseActions() throws {
        let foreign = try XCTUnwrap(URL(string: "https://example.com/__/auth/action?mode=signIn&oobCode=test-code"))
        let reset = try XCTUnwrap(URL(string: "\(origin)/__/auth/action?mode=resetPassword&oobCode=test-code"))
        let missingCode = try XCTUnwrap(URL(string: "\(origin)/__/auth/action?mode=signIn"))
        XCTAssertNil(NativeEmailSignInLink.actionURL(from: foreign))
        XCTAssertNil(NativeEmailSignInLink.actionURL(from: try wrap(foreign)))
        XCTAssertNil(NativeEmailSignInLink.actionURL(from: try wrap(reset)))
        XCTAssertNil(NativeEmailSignInLink.actionURL(from: missingCode))
    }

    private func wrap(_ action: URL) throws -> URL {
        var wrapper = try XCTUnwrap(URLComponents(string: "\(origin)/__/auth/links"))
        wrapper.queryItems = [URLQueryItem(name: "link", value: action.absoluteString)]
        return try XCTUnwrap(wrapper.url)
    }
}
