import XCTest
@testable import QuizzUpNativeCore

final class NativeEmailCredentialsTests: XCTestCase {
    func testAddressWhitespaceIsRemovedWithoutChangingPassword() {
        let credentials = NativeEmailCredentials(email: "  alex+quiz@example.com\n", password: " secret ", confirmation: " secret ")
        XCTAssertEqual(credentials.address, "alex+quiz@example.com")
        XCTAssertEqual(credentials.password, " secret ")
        XCTAssertTrue(credentials.canCreateAccount)
    }

    func testMalformedAddressesNeverEnableSubmission() {
        for address in ["", "alex", "alex@", "@example.com", "a b@example.com", "a@example", "a@@example.com"] {
            let credentials = NativeEmailCredentials(email: address, password: "secret", confirmation: "secret")
            XCTAssertFalse(credentials.canSignIn, address)
            XCTAssertFalse(credentials.canCreateAccount, address)
        }
    }

    func testCreationRequiresMatchingPasswordButExistingPasswordIsNotRejectedByNewPolicy() {
        let short = NativeEmailCredentials(email: "alex@example.com", password: "short", confirmation: "short")
        XCTAssertTrue(short.canSignIn)
        XCTAssertFalse(short.canCreateAccount)
        let mismatch = NativeEmailCredentials(email: "alex@example.com", password: "secret", confirmation: "Secret")
        XCTAssertFalse(mismatch.canCreateAccount)
        XCTAssertFalse(NativeEmailCredentials(email: "alex@example.com", password: "", confirmation: "").canSignIn)
    }
}
