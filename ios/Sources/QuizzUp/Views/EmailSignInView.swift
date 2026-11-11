import SwiftUI

struct EmailSignInView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var confirmation = ""
    @State private var creatingAccount = false
    @State private var resetting = false
    @State private var resetSent = false
    @FocusState private var focused: Field?
    private enum Field { case email, password, confirmation }
    private var credentials: NativeEmailCredentials {
        .init(email: email, password: password, confirmation: confirmation)
    }
    private var canSubmit: Bool {
        resetting ? credentials.validAddress : creatingAccount ? credentials.canCreateAccount : credentials.canSignIn
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(game.t(resetting ? "emailResetTitle" : "emailWelcome"))
                            .font(.system(size: 28, weight: .bold)).accessibilityAddTraits(.isHeader)
                        Text(game.t(resetting ? "emailResetHelp" : "emailHelp"))
                            .font(.subheadline).foregroundColor(Theme.muted).fixedSize(horizontal: false, vertical: true)
                    }
                    if !resetting {
                        Picker(game.t("emailMode"), selection: $creatingAccount) {
                            Text(game.t("emailSignIn")).tag(false)
                            Text(game.t("emailCreate")).tag(true)
                        }.pickerStyle(.segmented)
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text(game.t("emailAddress")).font(.subheadline.weight(.semibold))
                        TextField("", text: $email, prompt: Text("name@example.com").foregroundColor(Theme.muted))
                            .keyboardType(.emailAddress).textContentType(.emailAddress)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                            .focused($focused, equals: .email).submitLabel(resetting ? .send : .next)
                            .onSubmit { if resetting { submit() } else { focused = .password } }
                            .modifier(EmailFieldStyle())
                    }
                    if !resetting {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(game.t("emailPassword")).font(.subheadline.weight(.semibold))
                            SecureField(game.t("emailPassword"), text: $password)
                                .textContentType(creatingAccount ? .newPassword : .password)
                                .focused($focused, equals: .password).submitLabel(creatingAccount ? .next : .go)
                                .onSubmit { if creatingAccount { focused = .confirmation } else { submit() } }
                                .modifier(EmailFieldStyle())
                            if creatingAccount {
                                Text(game.t("emailPasswordHelp")).font(.footnote).foregroundColor(Theme.muted)
                            }
                        }
                        if creatingAccount {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(game.t("emailConfirmation")).font(.subheadline.weight(.semibold))
                                SecureField(game.t("emailConfirmation"), text: $confirmation)
                                    .textContentType(.newPassword).focused($focused, equals: .confirmation)
                                    .submitLabel(.go).onSubmit(submit).modifier(EmailFieldStyle())
                            }
                        }
                    }
                    if let error = auth.authError {
                        Text(error).font(.subheadline).foregroundColor(Theme.brand)
                            .accessibilityAddTraits(.updatesFrequently)
                    }
                    if resetSent {
                        Label(game.t("emailResetSent"), systemImage: "checkmark.circle")
                            .font(.subheadline).fixedSize(horizontal: false, vertical: true)
                    }
                    Button(action: submit) {
                        HStack(spacing: 10) {
                            if auth.isAuthenticating { ProgressView().tint(.white) }
                            Text(game.t(resetting ? "emailSendReset" : creatingAccount ? "emailCreate" : "emailSignIn"))
                        }
                        .font(.headline).foregroundColor(.white).padding(.horizontal, 12)
                        .frame(maxWidth: .infinity, minHeight: 54)
                        .background(Theme.brand, in: RoundedRectangle(cornerRadius: 14))
                        .opacity(canSubmit ? 1 : 0.55)
                    }
                    .disabled(!canSubmit)
                    if !creatingAccount || resetting {
                        Button(game.t(resetting ? "emailBackToSignIn" : "emailForgotPassword")) {
                            resetting.toggle()
                            if !resetting { creatingAccount = false }
                            resetSent = false; auth.authError = nil; focused = .email
                        }
                        .font(.subheadline.weight(.semibold)).foregroundColor(Theme.brand).frame(minHeight: 44)
                    }
                }
                .disabled(auth.isAuthenticating)
                .padding(24).frame(maxWidth: 480).frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively).background(Theme.paper.ignoresSafeArea())
            .navigationTitle(game.t("signInEmail")).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").frame(width: 44, height: 44)
                    }
                    .accessibilityLabel(game.t("cancel")).disabled(auth.isAuthenticating)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button { focused = nil } label: {
                        Image(systemName: "keyboard.chevron.compact.down").frame(width: 44, height: 44)
                    }
                    .accessibilityLabel(game.t("emailHideKeyboard"))
                }
            }
        }
        .buttonStyle(.plain).foregroundColor(Theme.ink).tint(Theme.brand).preferredColorScheme(.light)
        .interactiveDismissDisabled(auth.isAuthenticating)
        .onChange(of: creatingAccount) { _ in
            auth.authError = nil; confirmation = ""; focused = nil
        }
        .onChange(of: email) { _ in resetSent = false }
        .onAppear {
            #if DEBUG && STORE_CAPTURE
            if StoreCaptureConfiguration.options?.screen == "auth-email-create" { creatingAccount = true }
            if StoreCaptureConfiguration.options?.screen == "auth-email-reset" { resetting = true }
            if StoreCaptureConfiguration.options?.screen == "auth-email-keyboard" {
                email = "alex@example.com"
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { focused = .password }
            }
            #endif
        }
    }

    private func submit() {
        guard canSubmit, !auth.isAuthenticating else { return }
        focused = nil
        let values = credentials
        let reset = resetting
        let create = creatingAccount
        Task {
            if reset {
                resetSent = await auth.resetPassword(for: values.address, language: game.lang)
            } else if await auth.signInWithEmail(values.address, password: values.password, creatingAccount: create) {
                dismiss()
            }
        }
    }
}

private struct EmailFieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content.font(.body).padding(.horizontal, 14).frame(minHeight: 54)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Theme.muted.opacity(0.3)))
    }
}
