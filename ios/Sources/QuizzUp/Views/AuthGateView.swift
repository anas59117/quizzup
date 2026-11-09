import SwiftUI

struct AuthGateView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @State private var showEmail = false
    @State private var connectingSession = false
    @State private var sessionError = false

    var body: some View {
        ViewThatFits(in: .vertical) {
            VStack(spacing: 0) {
                languageMenu
                Spacer(minLength: 24)
                welcome.padding(.top, 28)
                Spacer(minLength: 36)
                actions
            }
            ScrollView {
                VStack(spacing: 26) {
                    languageMenu
                    welcome
                    actions
                }
            }
        }
        .foregroundColor(.white)
        .padding(.horizontal, 24)
        .padding(.bottom, 20)
        .frame(maxWidth: 430)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.brand.ignoresSafeArea())
        .sheet(isPresented: $showEmail) { EmailSignInView() }
        .onAppear {
            showEmail = auth.emailLink != nil
            completeSignInIfNeeded()
        }
        .onChange(of: auth.emailLink) { link in
            if link != nil { showEmail = true }
        }
        .onChange(of: auth.user?.uid) { uid in
            if uid != nil {
                showEmail = false
                completeSignInIfNeeded()
            }
        }
    }

    private var languageMenu: some View {
        Menu {
            Button("Français") { game.setLanguage("fr") }
            Button("English") { game.setLanguage("en") }
        } label: {
            Label(game.lang.uppercased(), systemImage: "chevron.down")
                .labelStyle(.titleAndIcon)
                .font(.subheadline.bold())
                .frame(minWidth: 55, minHeight: 44)
        }
        .accessibilityLabel(game.t("languageMenu"))
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    private var welcome: some View {
        VStack(spacing: 13) {
            NativeBrandLogo(scale: 1.43)
                .accessibilityAddTraits(.isHeader)
            Text(game.t("openingTagline"))
                .font(.body)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    private var actions: some View {
        VStack(spacing: 10) {
            if connectingSession || game.openingProfile {
                HStack(spacing: 10) {
                    ProgressView().tint(.white)
                    Text(game.t("signInLoading"))
                }
                .font(.subheadline)
            }
            if sessionError {
                VStack(spacing: 0) {
                    Text(game.t("serverUnreachable")).font(.subheadline)
                    Button(game.t("retry"), action: completeSignInIfNeeded)
                        .frame(minHeight: 44)
                }
                .multilineTextAlignment(.center)
            }

            providerButton(.apple, title: "signInApple", error: "appleSignInFailed") {
                Image(systemName: "apple.logo").accessibilityHidden(true)
            }
            providerButton(.google, title: "signInGoogle", error: "googleSignInFailed") {
                Image("GoogleSignInMark")
                    .resizable().renderingMode(.original)
                    .frame(width: 18, height: 18)
                    .accessibilityHidden(true)
            }

            Button {
                showEmail = true
            } label: {
                Label(game.t("signInEmail"), systemImage: "envelope")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 12)
                    .frame(minHeight: 44)
            }
            .disabled(auth.isAuthenticating || connectingSession || game.openingProfile)

            if let url = URL(string: "https://\(GameSocket.frontendHost)/privacy.html") {
                Link(destination: url) {
                    Text(game.t("authPrivacyPolicy"))
                        .font(.footnote)
                        .underline()
                        .padding(.horizontal, 10)
                        .frame(minHeight: 44)
                }
                .padding(.top, 5)
            }
        }
        .buttonStyle(.plain)
    }

    private func providerButton<Icon: View>(
        _ provider: AuthManager.Provider,
        title: String,
        error: String,
        @ViewBuilder icon: () -> Icon
    ) -> some View {
        VStack(spacing: 5) {
            Button {
                sessionError = false
                auth.signIn(with: provider)
            } label: {
                HStack(spacing: 10) {
                    if auth.activeProvider == provider {
                        ProgressView().tint(Theme.ink)
                        Text(game.t("signInLoading"))
                    } else {
                        icon()
                        Text(game.t(title))
                    }
                }
                .font(.headline)
                .foregroundColor(Theme.ink)
                .frame(maxWidth: .infinity, minHeight: 53)
                .padding(.horizontal, 12)
                .background(.white, in: RoundedRectangle(cornerRadius: 12))
            }
            .disabled(auth.isAuthenticating || connectingSession || game.openingProfile)

            if auth.failedProvider == provider {
                HStack {
                    Text(game.t(error)).font(.footnote)
                    Spacer()
                    Button {
                        auth.signIn(with: provider)
                    } label: {
                        Text(game.t("retry")).font(.footnote.bold()).underline()
                            .frame(minHeight: 44)
                    }
                    .disabled(auth.isAuthenticating || connectingSession || game.openingProfile)
                }
                .padding(.horizontal, 10)
                .background(.black.opacity(0.24), in: RoundedRectangle(cornerRadius: 9))
            }
        }
    }

    private func completeSignInIfNeeded() {
        guard let uid = auth.user?.uid, !connectingSession else { return }
        connectingSession = true
        sessionError = false
        Task {
            let token = await auth.getIdToken()
            connectingSession = false
            guard auth.user?.uid == uid else {
                completeSignInIfNeeded()
                return
            }
            guard let token else {
                sessionError = true
                return
            }
            game.identify(idToken: token, authManager: auth)
        }
    }
}
