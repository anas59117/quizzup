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

    override init() {
        super.init()
        guard !StoreCaptureConfiguration.enabled else { return }
        if FirebaseApp.app() == nil { FirebaseApp.configure() }
        user = Auth.auth().currentUser
    }

    /// Fetches a fresh ID token for the current session — used by GameSocket
    /// to send `identify` to the backend, the same handshake the web app
    /// does with `firebaseUser.getIdToken()`.
    func getIdToken() async -> String? {
        try? await user?.getIDToken()
    }

    func signOut() {
        guard !StoreCaptureConfiguration.enabled else { return }
        try? Auth.auth().signOut()
        try? GIDSignIn.sharedInstance.signOut()
        user = nil
    }

    // MARK: - Account deletion (App Store Guideline 5.1.1(v))

    @Published var isDeletingAccount = false
    @Published var deleteError: String?

    func deleteAccount() async {
        guard let firebaseUser = user else { return }
        isDeletingAccount = true
        deleteError = nil

        // 1. Get a fresh token to authenticate with backend
        guard let idToken = try? await firebaseUser.getIDToken() else {
            deleteError = L10n.t("deleteAccountFailed", lang: L10n.detectDefaultLang())
            isDeletingAccount = false
            return
        }

        // 2. Call backend to wipe server-side data
        let backendOk = await deleteBackendData(token: idToken)
        if !backendOk {
            deleteError = L10n.t("deleteAccountFailed", lang: L10n.detectDefaultLang())
            isDeletingAccount = false
            return
        }

        // 3. Delete Firebase Auth account
        do {
            try await firebaseUser.delete()
        } catch {
            deleteError = error.localizedDescription
            isDeletingAccount = false
            return
        }

        // 4. Clear local state
        UserDefaults.standard.removeObject(forKey: "quizzup.clientId")
        UserDefaults.standard.removeObject(forKey: "quizzup.name")
        UserDefaults.standard.removeObject(forKey: "quizzup.avatar")
        UserDefaults.standard.removeObject(forKey: "quizzup.lang")
        user = nil
        isDeletingAccount = false
    }

    private func deleteBackendData(token: String) async -> Bool {
        let urlString = "https://\(GameSocket.backendHost)/auth/delete-account"
        guard let url = URL(string: urlString) else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return false }
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               json["ok"] as? Bool == true {
                return true
            }
            return false
        } catch {
            return false
        }
    }

    // MARK: - Sign in with Apple

    private var currentAppleNonce: String?

    func signInWithApple() {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating else { return }
        let nonce = Self.randomNonceString()
        currentAppleNonce = nonce
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        isAuthenticating = true
        authError = nil
        controller.performRequests()
    }

    // MARK: - Google Sign-In

    func signInWithGoogle() {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating else { return }
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
            isAuthenticating = false
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let nonce = currentAppleNonce,
                  let tokenData = credential.identityToken,
                  let idTokenString = String(data: tokenData, encoding: .utf8) else {
                authError = localizedSignInFailed
                return
            }
            let firebaseCredential = OAuthProvider.credential(
                withProviderID: "apple.com", idToken: idTokenString, rawNonce: nonce
            )
            await finishSignIn(with: firebaseCredential)
        }
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            isAuthenticating = false
            // A user tapping "Cancel" on the system sheet also lands here —
            // don't surface that as a scary error message.
            if (error as? ASAuthorizationError)?.code != .canceled {
                authError = message(for: error)
            }
        }
    }
}
