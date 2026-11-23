import SwiftUI

struct NativeSettingsView: View {
    @ObservedObject private var ads = AdsManager.shared
    @AppStorage(NativeAppearance.storageKey) private var appearance = NativeAppearance.defaultValue.rawValue
    @EnvironmentObject private var audio: NativeAudioManager
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        NavigationStack {
            Form {
                Section(fr ? "Préférences" : "Preferences") {
                    Picker(fr ? "Apparence" : "Appearance", selection: $appearance) {
                        Text(fr ? "Automatique" : "Automatic").tag(NativeAppearance.system.rawValue)
                        Text(fr ? "Clair" : "Light").tag(NativeAppearance.light.rawValue)
                        Text(fr ? "Sombre" : "Dark").tag(NativeAppearance.dark.rawValue)
                    }
                    Toggle(fr ? "Musique et effets sonores" : "Music and sound effects", isOn: Binding(
                        get: { !audio.isMuted }, set: { audio.setMuted(!$0) }
                    ))
                    Picker(fr ? "Langue" : "Language", selection: Binding(
                        get: { game.lang },
                        set: { if $0 != game.lang { game.toggleLang() } }
                    )) {
                        Text("Français").tag("fr")
                        Text("English").tag("en")
                    }
                }
                Section(fr ? "Aide" : "Help") {
                    NavigationLink { NativeOnboardingGuide(manual: true) } label: {
                        Label(fr ? "Comment jouer" : "How to play", systemImage: "questionmark.circle")
                            .frame(minHeight: 44)
                    }
                }
                Section(fr ? "Compte" : "Account") {
                    LabeledContent(fr ? "Pseudo" : "Player name", value: game.name)
                    if let email = auth.user?.email {
                        Text(email).font(.subheadline).foregroundColor(Theme.muted).textSelection(.enabled)
                    }
                    Button {
                        dismiss()
                        auth.signOut()
                        game.resetForSignOut()
                    } label: {
                        Label(fr ? "Se déconnecter" : "Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            .frame(minHeight: 36)
                    }.foregroundColor(Theme.accent)
                    NativeDeleteAccountButton(onDeleted: { dismiss() })
                    if let error = auth.deleteError {
                        Text(error).font(.subheadline).foregroundColor(Theme.accent)
                            .accessibilityLabel("\(fr ? "Erreur" : "Error"): \(error)")
                    }
                }
                Section(fr ? "À propos" : "About") {
                    Button(fr ? "Vérification publicitaire" : "Advertising privacy") {
                        if ads.privacyOptionsRequired {
                            ads.presentPrivacyOptions()
                        } else {
                            dismiss()
                            ads.retryConsent()
                        }
                    }
                    .disabled(ads.consentBusy)
                    Link(game.t("privacyPolicy"), destination: URL(string: "https://\(GameSocket.frontendHost)/privacy.html")!)
                    Link(fr ? "Crédits des images" : "Image credits", destination: URL(string: "https://\(GameSocket.frontendHost)/image-credits.html")!)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.paper.ignoresSafeArea()).foregroundColor(Theme.ink)
            .navigationTitle(fr ? "Réglages" : "Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(fr ? "Fermer" : "Close") { dismiss() }
                }
            }
            .disabled(auth.isDeletingAccount)
            .overlay {
                if auth.isDeletingAccount {
                    Theme.paper.opacity(0.85).ignoresSafeArea()
                        .overlay(ProgressView(game.t("deleteAccount")).tint(Theme.accent))
                }
            }
        }
        .foregroundColor(Theme.ink).tint(Theme.accent)
        .preferredColorScheme(Theme.colorScheme(for: .stored(appearance)))
        .interactiveDismissDisabled(auth.isDeletingAccount)
    }
}
