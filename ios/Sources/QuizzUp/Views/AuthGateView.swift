import SwiftUI

struct AuthGateView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @State private var showEmail = false
    @State private var completingSignIn = false

    private var restoring: Bool {
        #if DEBUG && STORE_CAPTURE
        if StoreCaptureConfiguration.options?.screen == "auth-restoring" { return true }
        #endif
        return auth.user != nil || completingSignIn || game.restoringSession
    }

    var body: some View {
        Group {
            if restoring {
                restoration
            } else {
                ViewThatFits(in: .vertical) {
                    VStack(spacing: 0) {
                        language
                        Spacer(minLength: 28)
                        welcome
                        Spacer(minLength: 48)
                        actions
                        Spacer(minLength: 24)
                        privacy
                    }
                    ScrollView {
                        VStack(spacing: 28) {
                            language
                            welcome.padding(.vertical, 24)
                            actions
                            privacy
                        }
                    }
                }
            }
        }
        .foregroundColor(.white)
        .padding(.horizontal, 24).padding(.bottom, 16)
        .frame(maxWidth: 440).frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.pageBackground.ignoresSafeArea())
        .buttonStyle(.plain)
        .sheet(isPresented: $showEmail) { EmailSignInView() }
        .onAppear {
            #if DEBUG && STORE_CAPTURE
            if StoreCaptureConfiguration.options?.screen.hasPrefix("auth-email") == true { showEmail = true }
            #endif
            completeSignInIfNeeded()
        }
        .onChange(of: auth.user?.uid) { uid in
            guard uid != nil else { return }
            showEmail = false
            completeSignInIfNeeded()
        }
    }

    private var language: some View {
        HStack {
            Spacer()
            Button { game.toggleLang(); auth.authError = nil } label: {
                HStack(spacing: 5) {
                    Text(game.lang.uppercased())
                    Image(systemName: "chevron.down").font(.system(size: 10, weight: .semibold))
                }
                .font(.subheadline.weight(.semibold)).frame(minWidth: 52, minHeight: 44)
            }
            .accessibilityLabel(game.lang == "fr" ? "Changer la langue" : "Change language")
        }
    }

    private var welcome: some View {
        VStack(spacing: 22) {
            NativeBrandLogo(scale: 1.45).accessibilityAddTraits(.isHeader)
            Text(game.t("openingTagline"))
                .font(.system(size: 17)).lineSpacing(3)
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: 300)
        }
        .frame(maxWidth: .infinity)
    }

    private var actions: some View {
        VStack(spacing: 12) {
            if let error = auth.authError {
                Text(error).font(.subheadline).multilineTextAlignment(.center)
                    .accessibilityAddTraits(.updatesFrequently).padding(.bottom, 6)
            }
            if auth.isAuthenticating {
                HStack(spacing: 8) {
                    ProgressView().tint(.white)
                    Text(game.t("signInLoading")).font(.subheadline)
                }.padding(.bottom, 4)
            }
            providerButton(title: "signInApple", background: .white, foreground: .black) {
                Image(systemName: "apple.logo").font(.system(size: 22))
            } action: { auth.signInWithApple() }
            providerButton(title: "signInGoogle", background: Theme.lightPaper, foreground: Theme.onGold) {
                Image("GoogleSignInMark").resizable().renderingMode(.original).frame(width: 21, height: 21)
            } action: { auth.signInWithGoogle() }
            providerButton(title: "signInEmail", background: .clear, foreground: .white) {
                Image(systemName: "envelope").font(.system(size: 20, weight: .medium))
            } action: { auth.authError = nil; showEmail = true }
        }
        .disabled(auth.isAuthenticating)
    }

    private func providerButton<Icon: View>(title: String, background: Color, foreground: Color,
                                            @ViewBuilder icon: () -> Icon, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                icon().frame(width: 24).accessibilityHidden(true)
                Text(game.t(title)).font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(foreground).padding(.horizontal, 12)
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(background, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(.white.opacity(title == "signInEmail" ? 0.65 : 0)))
        }
    }

    private var restoration: some View {
        VStack(spacing: 26) {
            NativeBrandLogo(scale: 1.45)
            if let error = auth.authError {
                Text(error).font(.subheadline).multilineTextAlignment(.center)
                Button(game.t("retry"), action: completeSignInIfNeeded)
                    .font(.headline).frame(minHeight: 44)
                Button(game.t("authSwitchAccount")) {
                    auth.signOut(); auth.authError = nil; game.resetForSignOut()
                }
                .font(.subheadline).frame(minHeight: 44)
            } else {
                ProgressView().tint(.white).accessibilityLabel(game.t("restoringSession"))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var privacy: some View {
        Group {
            if let url = URL(string: "https://\(GameSocket.frontendHost)/privacy.html") {
                Link(game.t("privacyPolicy"), destination: url)
                    .font(.footnote).frame(minHeight: 44)
            }
        }
    }

    private func completeSignInIfNeeded() {
        guard !completingSignIn, !game.restoringSession, let uid = auth.user?.uid else { return }
        auth.authError = nil
        completingSignIn = true
        Task {
            defer { completingSignIn = false }
            let token = await auth.getIdToken()
            guard auth.user?.uid == uid else { return }
            guard let idToken = token else { auth.authError = game.t("serverUnreachable"); return }
            game.identify(idToken: idToken, authManager: auth)
        }
    }
}
