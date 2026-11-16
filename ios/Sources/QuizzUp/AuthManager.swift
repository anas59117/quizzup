import Foundation
import Combine
import UIKit
import CryptoKit
import AuthenticationServices
import FirebaseCore
import FirebaseAuth
import GoogleSignIn

/// Mandatory sign-in gate for the iOS app (the web app allows anonymous
/// play; this app requires a real account, per product decision — see
/// AuthGateView). Both providers land in the same Firebase project as the
/// web app, so a player's uid/stats/friends carry over if they play both.
@MainActor
final class AuthManager: NSObject, ObservableObject {
    @Published var user: FirebaseAuth.User?
    @Published var isAuthenticating = false
    @Published var authError: String?
    @Published private(set) var deletionPending = false

    override init() {
        super.init()
        guard !StoreCaptureConfiguration.enabled else { return }
        if FirebaseApp.app() == nil { FirebaseApp.configure() }
        user = Auth.auth().currentUser
        refreshDeletionPending()
    }

    /// Fetches a fresh ID token for the current session — used by GameSocket
    /// to send `identify` to the backend, the same handshake the web app
    /// does with `firebaseUser.getIdToken()`.
    func getIdToken() async -> String? {
        guard !deletionPending else { return nil }
        return try? await user?.getIDToken()
    }

    func signOut() {
        guard !StoreCaptureConfiguration.enabled else { return }
        try? Auth.auth().signOut()
        try? GIDSignIn.sharedInstance.signOut()
        user = nil
        deletionPending = false
    }

    // MARK: - Account deletion (App Store Guideline 5.1.1(v))

    @Published var isDeletingAccount = false
    @Published var deleteError: String?

    var deletionNeedsPassword: Bool {
        guard let providers = user?.providerData.map(\.providerID) else { return false }
        return !providers.contains("apple.com") && !providers.contains("google.com") && providers.contains("password")
    }

    private enum DeletionFailure: Error { case unavailable, recentLoginRequired }

    private func refreshDeletionPending() {
        deletionPending = user.map { UserDefaults.standard.bool(forKey: "quizzup.deletionPending.\($0.uid)") } ?? false
    }

    func resumeAccountDeletion() {
        guard let user else { return }
        UserDefaults.standard.set(true, forKey: "quizzup.deletionPending.\(user.uid)")
        deletionPending = true
    }

    func deleteAccount(password: String = "") async {
        guard !StoreCaptureConfiguration.enabled, !isDeletingAccount, let firebaseUser = user else { return }
        isDeletingAccount = true
        deleteError = nil
        defer { isDeletingAccount = false }
        do {
            try await NativeAccountDeletion.run(
                reauthenticate: { try await self.reauthenticateForDeletion(firebaseUser, password: password) },
                token: { try await firebaseUser.idTokenForcingRefresh(true) },
                markPending: {
                    // Persist before sending: a lost HTTP reply must not restore gameplay.
                    self.resumeAccountDeletion()
                },
                deleteBackend: { try await self.deleteBackendData(token: $0) },
                revokeApple: { try await Auth.auth().revokeToken(withAuthorizationCode: $0) },
                deleteIdentity: { try await firebaseUser.delete() })
        } catch is CancellationError {
            return
        } catch {
            if deletionPending {
                deleteError = deletionText("deleteAccountPendingFailed")
            } else if let failure = error as? DeletionFailure, case .unavailable = failure {
                deleteError = deletionText("deleteAccountFailed")
            } else if AuthErrorCode.Code(rawValue: (error as NSError).code) == .networkError {
                deleteError = deletionText("serverUnreachable")
            } else {
                deleteError = deletionText("deleteAccountReauthenticate")
            }
            return
        }
        UserDefaults.standard.removeObject(forKey: "quizzup.deletionPending.\(firebaseUser.uid)")
        for key in ["quizzup.clientId", "quizzup.name", "quizzup.avatar", "quizzup.lang"] {
            UserDefaults.standard.removeObject(forKey: key)
        }
        GIDSignIn.sharedInstance.signOut()
        user = nil
        deletionPending = false
    }

    private func deletionText(_ key: String) -> String {
        L10n.t(key, lang: L10n.detectDefaultLang())
    }

    private func reauthenticateForDeletion(_ firebaseUser: FirebaseAuth.User, password: String) async throws -> String? {
        let providers = firebaseUser.providerData.map(\.providerID)
        let credential: AuthCredential
        var appleCode: String?
        if providers.contains("apple.com") {
            let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<(AuthCredential, String), Error>) in
                appleReauthentication = continuation
                beginAppleRequest()
            }
            credential = result.0
            appleCode = result.1
        } else if providers.contains("google.com") {
            credential = try await googleCredentialForDeletion()
        } else if providers.contains("password"), let email = firebaseUser.email, !password.isEmpty {
            credential = EmailAuthProvider.credential(withEmail: email, password: password)
        } else {
            throw DeletionFailure.unavailable
        }
        _ = try await firebaseUser.reauthenticate(with: credential)
        guard user?.uid == firebaseUser.uid else { throw CancellationError() }
        return appleCode
    }

    private func googleCredentialForDeletion() async throws -> AuthCredential {
        guard let clientID = FirebaseApp.app()?.options.clientID,
              let rootVC = Self.activeKeyWindow()?.rootViewController else { throw DeletionFailure.unavailable }
        var presenter = rootVC
        while let presented = presenter.presentedViewController { presenter = presented }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        return try await withCheckedThrowingContinuation { continuation in
            GIDSignIn.sharedInstance.signIn(withPresenting: presenter) { result, error in
                if let error {
                    if (error as NSError).code == -5 { continuation.resume(throwing: CancellationError()) }
                    else { continuation.resume(throwing: error) }
                    return
                }
                guard let googleUser = result?.user, let token = googleUser.idToken?.tokenString else {
                    continuation.resume(throwing: DeletionFailure.unavailable); return
                }
                continuation.resume(returning: GoogleAuthProvider.credential(withIDToken: token, accessToken: googleUser.accessToken.tokenString))
            }
        }
    }

    private func deleteBackendData(token: String) async throws {
        guard let url = URL(string: "https://\(GameSocket.backendHost)/auth/delete-account") else { throw DeletionFailure.unavailable }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await URLSession.shared.data(for: request)
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        guard let http = response as? HTTPURLResponse, http.statusCode == 200, json?["ok"] as? Bool == true else {
            if json?["code"] as? String == "RECENT_LOGIN_REQUIRED" { throw DeletionFailure.recentLoginRequired }
            throw DeletionFailure.unavailable
        }
    }

    // MARK: - Sign in with Apple

    private var currentAppleNonce: String?
    private var appleController: ASAuthorizationController?
    private var appleReauthentication: CheckedContinuation<(AuthCredential, String), Error>?

    func signInWithApple() {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating, !isDeletingAccount else { return }
        isAuthenticating = true
        authError = nil
        beginAppleRequest()
    }

    private func beginAppleRequest() {
        let nonce = Self.randomNonceString()
        currentAppleNonce = nonce
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        appleController = controller
        controller.performRequests()
    }

    // MARK: - Google Sign-In

    func signInWithGoogle() {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating, !isDeletingAccount else { return }
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            authError = "Missing GoogleService-Info.plist"
            return
        }
        guard let rootVC = Self.activeKeyWindow()?.rootViewController else {
            authError = localizedSignInFailed
            return
        }

        isAuthenticating = true
        authError = nil
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.signIn(withPresenting: rootVC) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }
                self.isAuthenticating = false
                if let error {
                    if (error as NSError).code != -5 { self.authError = self.message(for: error) }
                    return
                }
                guard let googleUser = result?.user, let idToken = googleUser.idToken?.tokenString else {
                    self.authError = self.localizedSignInFailed
                    return
                }
                let credential = GoogleAuthProvider.credential(
                    withIDToken: idToken, accessToken: googleUser.accessToken.tokenString
                )
                await self.finishSignIn(with: credential)
            }
        }
    }

    private func finishSignIn(with credential: AuthCredential) async {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            let result = try await Auth.auth().signIn(with: credential)
            user = result.user
            refreshDeletionPending()
        } catch {
            authError = message(for: error)
        }
    }

    // MARK: - Email and password (same Firebase identity as other providers)

    func signInWithEmail(_ email: String, password: String, creatingAccount: Bool) async -> Bool {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating, user == nil else { return false }
        isAuthenticating = true
        authError = nil
        defer { isAuthenticating = false }
        do {
            let result: AuthDataResult
            if creatingAccount {
                result = try await Auth.auth().createUser(withEmail: email, password: password)
            } else {
                result = try await Auth.auth().signIn(withEmail: email, password: password)
            }
            user = result.user
            refreshDeletionPending()
            return true
        } catch {
            authError = message(for: error)
            return false
        }
    }

    func resetPassword(for email: String, language: String) async -> Bool {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating, user == nil else { return false }
        isAuthenticating = true
        authError = nil
        defer { isAuthenticating = false }
        Auth.auth().languageCode = language
        do {
            try await Auth.auth().sendPasswordReset(withEmail: email)
            return true
        } catch {
            if AuthErrorCode.Code(rawValue: (error as NSError).code) == .userNotFound { return true }
            authError = message(for: error)
            return false
        }
    }

    fileprivate func message(for error: Error) -> String {
        let key: String
        switch AuthErrorCode.Code(rawValue: (error as NSError).code) {
        case .invalidEmail: key = "emailInvalid"
        case .weakPassword: key = "emailWeakPassword"
        case .emailAlreadyInUse: key = "emailAlreadyInUse"
        case .invalidCredential, .wrongPassword, .userNotFound: key = "emailCredentialsFailed"
        case .tooManyRequests: key = "authTooManyRequests"
        case .networkError: key = "serverUnreachable"
        case .operationNotAllowed: key = "authUnavailable"
        case .userDisabled: key = "authAccountUnavailable"
        default: key = "signInFailed"
        }
        return L10n.t(key, lang: L10n.detectDefaultLang())
    }

    // MARK: - Nonce helpers (required by Sign in with Apple + Firebase, to
    // guard against replay attacks — same approach as Apple/Firebase's docs)

    private static func randomNonceString(length: Int = 32) -> String {
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var random: UInt8 = 0
            _ = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            if random < charset.count {
                result.append(charset[Int(random)])
                remaining -= 1
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    fileprivate static func activeKeyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow }
            .first
    }

    // AuthManager has no GameSocket reference for its `lang`/`t()`, but both
    // read the same "quizzup.lang" UserDefaults key, so this stays in sync.
    fileprivate var localizedSignInFailed: String {
        L10n.t("signInFailed", lang: L10n.detectDefaultLang())
    }
}

extension AuthManager: ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        Self.activeKeyWindow() ?? ASPresentationAnchor()
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task { @MainActor in
            appleController = nil
            isAuthenticating = false
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let nonce = currentAppleNonce,
                  let tokenData = credential.identityToken,
                  let idTokenString = String(data: tokenData, encoding: .utf8) else {
                if let continuation = appleReauthentication {
                    appleReauthentication = nil
                    continuation.resume(throwing: DeletionFailure.unavailable)
                } else { authError = localizedSignInFailed }
                return
            }
            let firebaseCredential = OAuthProvider.credential(
                withProviderID: "apple.com", idToken: idTokenString, rawNonce: nonce
            )
            if let continuation = appleReauthentication {
                appleReauthentication = nil
                guard let codeData = credential.authorizationCode,
                      let code = String(data: codeData, encoding: .utf8), !code.isEmpty else {
                    continuation.resume(throwing: DeletionFailure.unavailable); return
                }
                continuation.resume(returning: (firebaseCredential, code))
                return
            }
            await finishSignIn(with: firebaseCredential)
        }
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            appleController = nil
            isAuthenticating = false
            if let continuation = appleReauthentication {
                appleReauthentication = nil
                if (error as? ASAuthorizationError)?.code == .canceled { continuation.resume(throwing: CancellationError()) }
                else { continuation.resume(throwing: error) }
                return
            }
            // A user tapping "Cancel" on the system sheet also lands here —
            // don't surface that as a scary error message.
            if (error as? ASAuthorizationError)?.code != .canceled {
                authError = message(for: error)
            }
        }
    }
}
