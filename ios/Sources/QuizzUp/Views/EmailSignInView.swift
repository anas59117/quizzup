import SwiftUI

struct EmailSignInView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var message: String?

    private var trimmedEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var confirmingLink: Bool { auth.emailLink != nil }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(game.t(confirmingLink ? "emailConfirmHelp" : "emailSignInHelp"))
                    TextField(game.t("emailAddress"), text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .disabled(auth.emailBusy)
                        .onSubmit(submit)

                    Button(action: submit) {
                        HStack {
                            if auth.emailBusy { ProgressView() }
                            Text(game.t(confirmingLink ? "emailConfirm" : "emailSendLink"))
                        }
                        .frame(minHeight: 44)
                    }
                    .disabled(!trimmedEmail.contains("@") || auth.isAuthenticating)
                }
                if let message {
                    Section {
                        Text(game.t(message))
                        if confirmingLink && message == "emailConfirmFailed" {
                            Button(game.t("emailRequestNewLink")) {
                                auth.discardEmailLink()
                                self.message = nil
                            }
                        }
                    }
                }
            }
            .navigationTitle(game.t("signInEmail"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(game.t("cancel")) { dismiss() }
                        .disabled(auth.emailBusy)
                }
            }
            .onAppear { email = auth.pendingEmail }
            .onChange(of: auth.emailLink) { link in
                if link != nil {
                    if email.isEmpty { email = auth.pendingEmail }
                    message = nil
                }
            }
        }
        .preferredColorScheme(.light)
        .interactiveDismissDisabled(auth.emailBusy)
    }

    private func submit() {
        guard trimmedEmail.contains("@"), !auth.isAuthenticating else { return }
        let address = trimmedEmail
        let hasLink = confirmingLink
        message = nil
        Task {
            if hasLink {
                if await auth.signInWithEmail(address) {
                    dismiss()
                } else {
                    message = "emailConfirmFailed"
                }
            } else {
                let sent = await auth.sendEmailLink(to: address, language: game.lang)
                if !confirmingLink { message = sent ? "emailLinkSent" : "emailSendFailed" }
            }
        }
    }
}
