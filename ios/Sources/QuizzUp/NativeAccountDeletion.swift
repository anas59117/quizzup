import Foundation

/// Keeps provider cancellation ahead of destructive work, and identity removal
/// behind durable backend cleanup. The pending marker also covers a lost reply.
enum NativeAccountDeletion {
    @MainActor static func run(
        reauthenticate: () async throws -> String?,
        token: () async throws -> String,
        markPending: () -> Void,
        deleteBackend: (String) async throws -> Void,
        revokeApple: (String) async throws -> Void,
        deleteIdentity: () async throws -> Void
    ) async throws {
        let appleCode = try await reauthenticate()
        let idToken = try await token()
        markPending()
        try await deleteBackend(idToken)
        if let appleCode { try await revokeApple(appleCode) }
        try await deleteIdentity()
    }
}
