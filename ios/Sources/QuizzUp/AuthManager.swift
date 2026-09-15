import Foundation
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
        try? Auth.auth().signOut()
        try? GIDSignIn.sharedInstance.signOut()
        user = nil
    }

    // MARK: - Sign in with Apple

    private var currentAppleNonce: String?

    func signInWithApple() {
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
                    self.authError = error.localizedDescription
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
        do {
            let result = try await Auth.auth().signIn(with: credential)
            user = result.user
        } catch {
            authError = error.localizedDescription
        }
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
                authError = error.localizedDescription
            }
        }
    }
}
