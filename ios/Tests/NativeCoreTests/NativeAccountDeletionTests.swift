import XCTest
@testable import QuizzUpNativeCore

final class NativeAccountDeletionTests: XCTestCase {
    private enum Failure: Error { case cancelled, backend, revocation }

    @MainActor func testCancellationNeverStartsBackendDeletion() async {
        var steps: [String] = []
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { throw Failure.cancelled },
                token: { steps.append("token"); return "token" },
                markPending: { steps.append("pending") },
                deleteBackend: { _ in steps.append("backend") },
                revokeApple: { _ in steps.append("revoke") },
                deleteIdentity: { steps.append("identity") })
            XCTFail("Cancellation must stop deletion")
        } catch {}
        XCTAssertEqual(steps, [])
    }

    @MainActor func testBackendFailureRetainsIdentityAndPendingRecovery() async {
        var steps: [String] = []
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { steps.append("reauth"); return "apple-code" },
                token: { steps.append("token"); return "token" },
                markPending: { steps.append("pending") },
                deleteBackend: { _ in steps.append("backend"); throw Failure.backend },
                revokeApple: { _ in steps.append("revoke") },
                deleteIdentity: { steps.append("identity") })
            XCTFail("Backend failure must stop identity removal")
        } catch {}
        XCTAssertEqual(steps, ["reauth", "token", "pending", "backend"])
    }

    @MainActor func testTokenFailureCannotStartDeletion() async {
        var started = false
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { nil }, token: { throw Failure.backend },
                markPending: { started = true }, deleteBackend: { _ in started = true },
                revokeApple: { _ in started = true }, deleteIdentity: { started = true })
            XCTFail("A missing fresh token must stop deletion")
        } catch {}
        XCTAssertFalse(started)
    }

    @MainActor func testIdentityFailureRetainsPendingMarkerForRetry() async {
        var pending = false
        var backendFinished = false
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { nil }, token: { "token" },
                markPending: { pending = true }, deleteBackend: { _ in backendFinished = true },
                revokeApple: { _ in }, deleteIdentity: { throw Failure.backend })
            XCTFail("Identity failure must remain retryable")
        } catch {}
        XCTAssertTrue(pending)
        XCTAssertTrue(backendFinished)
    }

    @MainActor func testAppleRevocationPrecedesIdentityRemoval() async throws {
        var steps: [String] = []
        try await NativeAccountDeletion.run(
            reauthenticate: { steps.append("reauth"); return "apple-code" },
            token: { steps.append("token"); return "token" },
            markPending: { steps.append("pending") },
            deleteBackend: { token in XCTAssertEqual(token, "token"); steps.append("backend") },
            revokeApple: { code in XCTAssertEqual(code, "apple-code"); steps.append("revoke") },
            deleteIdentity: { steps.append("identity") })
        XCTAssertEqual(steps, ["reauth", "token", "pending", "backend", "revoke", "identity"])
    }

    @MainActor func testRevocationFailureCanBeRetriedWithoutDeletingIdentity() async {
        var removedIdentity = false
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { "apple-code" }, token: { "token" }, markPending: {},
                deleteBackend: { _ in }, revokeApple: { _ in throw Failure.revocation },
                deleteIdentity: { removedIdentity = true })
            XCTFail("Failed revocation must remain retryable")
        } catch {}
        XCTAssertFalse(removedIdentity)
    }

    @MainActor func testEmailDeletionDoesNotAttemptAppleRevocation() async throws {
        var revoked = false
        var removed = false
        try await NativeAccountDeletion.run(
            reauthenticate: { nil }, token: { "token" }, markPending: {},
            deleteBackend: { _ in }, revokeApple: { _ in revoked = true },
            deleteIdentity: { removed = true })
        XCTAssertFalse(revoked)
        XCTAssertTrue(removed)
    }
}
