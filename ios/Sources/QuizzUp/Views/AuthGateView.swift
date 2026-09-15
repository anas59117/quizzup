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

    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Spacer()
                Button(game.lang == "fr" ? "🇫🇷" : "🇬🇧") { game.toggleLang() }
                    .font(.system(size: 20))
            }
            Spacer()
            Text("Quizz").font(.system(size: 40, weight: .heavy)) +
            Text("Up").font(.system(size: 40, weight: .heavy)).foregroundColor(Theme.accent)
            Text(game.t("tagline")).foregroundColor(Theme.textDim)

            Spacer()

            if auth.isAuthenticating {
                ProgressView().tint(Theme.text)
            }

            if let error = auth.authError {
                Text(error).font(.caption).foregroundColor(Theme.red).multilineTextAlignment(.center)
                // Covers the already-signed-in-at-launch case: if the one-shot
                // onAppear token fetch fails, onChange(of: uid) never fires
                // again (the uid isn't changing), so this is the only way
                // back without force-quitting the app.
                if showAutoRetry {
                    Button(game.t("retry")) { completeSignInIfNeeded() }
                        .font(.caption.bold())
                        .foregroundColor(Theme.accent)
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
            .disabled(auth.isAuthenticating)

            Button {
                showAutoRetry = false
                auth.signInWithGoogle()
            } label: {
                HStack {
                    Image(systemName: "g.circle.fill")
                    Text(game.t("signInGoogle"))
                }
                .font(.headline)
                .foregroundColor(Theme.text)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.surface)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
                .cornerRadius(12)
            }
            .disabled(auth.isAuthenticating)

            if let url = URL(string: "https://\(GameSocket.frontendHost)/privacy.html") {
                Link(game.t("privacyPolicy"), destination: url)
                    .font(.caption)
                    .foregroundColor(Theme.textDim)
            }
            Spacer()
        }
        .padding(24)
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
        guard auth.user != nil else { return }
        Task {
            guard let idToken = await auth.getIdToken() else {
                auth.authError = game.t("serverUnreachable")
                showAutoRetry = true
                return
            }
            game.identify(idToken: idToken, authManager: auth)
            game.stage = .join
        }
    }
}
