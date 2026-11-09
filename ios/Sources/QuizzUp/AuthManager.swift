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
/// AuthGateView). Sign-in uses the same Firebase project as the
/// web app, so a player's uid/stats/friends carry over if they play both.
@MainActor
final class AuthManager: NSObject, ObservableObject {
    @Published var user: FirebaseAuth.User?
    enum Provider: Equatable { case apple, google }

    private static let emailLinkHost = "quizzup-ae633.firebaseapp.com"
    private static let pendingEmailKey = "quizzup.pendingSignInEmail"

    @Published private(set) var activeProvider: Provider?
    @Published private(set) var failedProvider: Provider?
    @Published private(set) var emailLink: String?
    @Published private(set) var emailBusy = false

    var isAuthenticating: Bool { activeProvider != nil || emailBusy }
    var pendingEmail: String { UserDefaults.standard.string(forKey: Self.pendingEmailKey) ?? "" }

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
        GIDSignIn.sharedInstance.signOut()
        failedProvider = nil
        discardEmailLink()
        UserDefaults.standard.removeObject(forKey: Self.pendingEmailKey)
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
        UserDefaults.standard.removeObject(forKey: "quizzup.profileConfirmed.\(firebaseUser.uid)")
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

    func signIn(with provider: Provider) {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating else { return }
        failedProvider = nil
        activeProvider = provider
        switch provider {
        case .apple: signInWithApple()
        case .google: signInWithGoogle()
        }
    }

    private func signInWithApple() {
        let nonce = Self.randomNonceString()
        currentAppleNonce = nonce
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    // MARK: - Google Sign-In

    private func signInWithGoogle() {
        guard let clientID = FirebaseApp.app()?.options.clientID,
              let rootVC = Self.activeKeyWindow()?.rootViewController else {
            finishProvider(.google, failed: true)
            return
        }

        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.signIn(withPresenting: rootVC) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }
                if let error {
                    self.finishProvider(.google, failed: (error as? GIDSignInError)?.code != .canceled)
                    return
                }
                guard let googleUser = result?.user, let idToken = googleUser.idToken?.tokenString else {
                    self.finishProvider(.google, failed: true)
                    return
                }
                let credential = GoogleAuthProvider.credential(
                    withIDToken: idToken, accessToken: googleUser.accessToken.tokenString
                )
                await self.finishSignIn(with: credential, provider: .google)
            }
        }
    }

    private func finishProvider(_ provider: Provider, failed: Bool) {
        activeProvider = nil
        if failed { failedProvider = provider }
    }

    private func finishSignIn(with credential: AuthCredential, provider: Provider) async {
        do {
            let result = try await Auth.auth().signIn(with: credential)
            finishProvider(provider, failed: false)
            discardEmailLink()
            user = result.user
        } catch {
            finishProvider(provider, failed: true)
        }
    }

    func sendEmailLink(to email: String, language: String) async -> Bool {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating,
              let bundleID = Bundle.main.bundleIdentifier,
              let continueURL = URL(string: "https://\(Self.emailLinkHost)") else { return false }
        let settings = ActionCodeSettings()
        settings.url = continueURL
        settings.handleCodeInApp = true
        settings.setIOSBundleID(bundleID)

        emailBusy = true
        defer { emailBusy = false }
        let auth = Auth.auth()
        auth.languageCode = language
        do {
            try await auth.sendSignInLink(toEmail: email, actionCodeSettings: settings)
            UserDefaults.standard.set(email, forKey: Self.pendingEmailKey)
            return true
        } catch {
            return false
        }
    }

    func receiveEmailLink(_ url: URL) {
        guard !StoreCaptureConfiguration.enabled, user == nil,
              url.scheme == "https", url.host == Self.emailLinkHost,
              Auth.auth().isSignIn(withEmailLink: url.absoluteString) else { return }
        emailLink = url.absoluteString
    }

    func discardEmailLink() { emailLink = nil }

    func signInWithEmail(_ email: String) async -> Bool {
        guard !StoreCaptureConfiguration.enabled, !isAuthenticating,
              user == nil, let emailLink else { return false }
        emailBusy = true
        defer { emailBusy = false }
        do {
            let result = try await Auth.auth().signIn(withEmail: email, link: emailLink)
            discardEmailLink()
            UserDefaults.standard.removeObject(forKey: Self.pendingEmailKey)
            user = result.user
            return true
        } catch {
            return false
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

}

extension AuthManager: ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        Self.activeKeyWindow() ?? ASPresentationAnchor()
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task { @MainActor in
            let nonce = currentAppleNonce
            currentAppleNonce = nil
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let nonce,
                  let tokenData = credential.identityToken,
                  let idTokenString = String(data: tokenData, encoding: .utf8) else {
                finishProvider(.apple, failed: true)
                return
            }
            let firebaseCredential = OAuthProvider.appleCredential(
                withIDToken: idTokenString, rawNonce: nonce, fullName: credential.fullName
            )
            await finishSignIn(with: firebaseCredential, provider: .apple)
        }
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            currentAppleNonce = nil
            finishProvider(.apple, failed: (error as? ASAuthorizationError)?.code != .canceled)
        }
    }
}
