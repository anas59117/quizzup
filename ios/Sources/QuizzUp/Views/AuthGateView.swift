import SwiftUI

/// Mandatory sign-in screen — nothing past this point (JoinView/Home/play)
/// is reachable without a real account, per product decision. Both buttons
/// go through AuthManager into the same Firebase project the web app uses.
struct AuthGateView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    // Only true while auth.authError came from completeSignInIfNeeded's own
    // silent retry (an already-cached session whose token fetch failed) —
    // never from a fresh, user-initiated sign-in attempt. Without this, a
    // failed "switch account" tap could show Retry and, if tapped, silently
    // resume the OLD cached session instead of the account the user just
    // tried to sign into.
    @State private var showAutoRetry = false
    @State private var completingSignIn = false

    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Spacer()
                Button(game.lang.uppercased()) { game.toggleLang() }
                    .font(.subheadline.bold()).frame(minWidth: 44, minHeight: 44)
                    .accessibilityLabel(game.lang == "fr" ? "Changer la langue" : "Change language")
            }
            Spacer()
            NativeBrandLogo().scaleEffect(1.3).padding(.vertical, 16)
            Text(game.t("tagline")).foregroundColor(.white).multilineTextAlignment(.center)

            Spacer()

            if auth.isAuthenticating || completingSignIn || game.restoringSession {
                ProgressView().tint(Theme.text)
            }

            if let error = auth.authError {
                Text(error).font(.subheadline).foregroundColor(.white).multilineTextAlignment(.center)
                // Covers the already-signed-in-at-launch case: if the one-shot
                // onAppear token fetch fails, onChange(of: uid) never fires
                // again (the uid isn't changing), so this is the only way
                // back without force-quitting the app.
                if showAutoRetry {
                    Button(game.t("retry")) { completeSignInIfNeeded() }
                        .font(.caption.bold())
                        .foregroundColor(Theme.gold).frame(minHeight: 44)
                }
            }

            Button {
                showAutoRetry = false
                auth.signInWithApple()
            } label: {
                HStack {
                    Image(systemName: "apple.logo")
                    Text(game.t("signInApple"))
                }
                .font(.headline)
                .foregroundColor(.black)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .cornerRadius(12)
            }
            .disabled(auth.isAuthenticating || completingSignIn || game.restoringSession)

            Button {
                showAutoRetry = false
                auth.signInWithGoogle()
            } label: {
                HStack {
                    Image(systemName: "g.circle.fill")
                    Text(game.t("signInGoogle"))
                }
                .font(.headline)
                .foregroundColor(Theme.ink)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.paper)
                .cornerRadius(12)
            }
            .disabled(auth.isAuthenticating || completingSignIn || game.restoringSession)

            if let url = URL(string: "https://\(GameSocket.frontendHost)/privacy.html") {
                Link(game.t("privacyPolicy"), destination: url)
                    .font(.caption)
                    .foregroundColor(.white)
            }
            Spacer()
        }
        .foregroundColor(.white).padding(24).frame(maxWidth: 520).frame(maxWidth: .infinity)
        .background(Theme.brand.ignoresSafeArea())
        // onAppear covers a user whose Firebase session is already
        // persisted at launch (AuthManager.init() sets `user` synchronously,
        // so onChange below never fires for them); onChange covers a fresh
        // sign-in completing while this view is already on screen.
        .onAppear { completeSignInIfNeeded() }
        .onChange(of: auth.user?.uid) { newUid in
            guard newUid != nil else { return }
            completeSignInIfNeeded()
        }
    }

    private func completeSignInIfNeeded() {
        guard !completingSignIn, !game.restoringSession, let uid = auth.user?.uid else { return }
        completingSignIn = true
        Task {
            defer { completingSignIn = false }
            let token = await auth.getIdToken()
            guard auth.user?.uid == uid else { return }
            guard let idToken = token else {
                auth.authError = game.t("serverUnreachable")
                showAutoRetry = true
                return
            }
            game.identify(idToken: idToken, authManager: auth)
        }
    }
}
