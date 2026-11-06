// Direction: warm editorial profile with real player progress on ivory surfaces.
// Rules: optional server data stays optional; account actions use AuthManager.
// Signature: player portrait and level lead a quiet, readable account page.
import SwiftUI

struct NativeProfileView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @State private var showSettings = false
    var onOpenMessages: () -> Void = {}
    private var fr: Bool { game.lang == "fr" }
    private var level: Int { game.stats?.level ?? 1 }
    private var progress: Double {
        guard let stats = game.stats, stats.xpForLevel > 0 else { return 0 }
        return min(1, max(0, Double(stats.xpIntoLevel) / Double(stats.xpForLevel)))
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                NativeSectionTitle(title: fr ? "Mon profil" : "My profile")
                identity
                if let error = game.socialError {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(error).font(.system(size: 14))
                        Button(fr ? "Réessayer" : "Try again") { game.requestProfile() }
                            .font(.system(size: 14, weight: .bold)).frame(minHeight: 44)
                    }.foregroundColor(.white)
                }
                statistics
                themes
                friends
                account
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
            .frame(maxWidth: 600).frame(maxWidth: .infinity)
        }
        .refreshable { game.requestProfile() }
        .sheet(isPresented: $showSettings) { NativeSettingsView() }
    }

    private var identity: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 16) {
                NativePlayerPortrait(avatar: game.avatar, size: 74)
                VStack(alignment: .leading, spacing: 5) {
                    Text(game.name).font(.system(size: 24, weight: .bold))
                        .tracking(-0.5).fixedSize(horizontal: false, vertical: true)
                    Text("\(fr ? "Niveau" : "Level") \(level)")
                        .font(.system(size: 14, weight: .semibold)).foregroundColor(Theme.brand)
                }
                Spacer(minLength: 0)
            }
            if let stats = game.stats {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(stats.xpIntoLevel) / \(stats.xpForLevel) XP")
                        Spacer()
                        Text("\(fr ? "Niveau" : "Level") \(level + 1)")
                    }.font(.system(size: 12, weight: .medium)).foregroundColor(Theme.muted)
                    ProgressView(value: progress).tint(Theme.brand)
                        .accessibilityLabel(fr ? "Progression du niveau" : "Level progress")
                }
            } else if game.socialError == nil {
                Text(fr ? "Jouez pour gagner de l’XP et faire progresser votre niveau." : "Play to earn XP and grow your level.")
                    .font(.system(size: 14)).foregroundColor(Theme.muted)
            }
        }
        .padding(20).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(Theme.ink)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 20))
    }

    private var statistics: some View {
        VStack(alignment: .leading, spacing: 12) {
            NativeSectionTitle(title: fr ? "En chiffres" : "Your stats")
            HStack(spacing: 10) {
                statistic(value: game.stats.map { String($0.games) }, title: fr ? "Parties" : "Games", symbol: "gamecontroller")
                statistic(value: game.stats.map { String($0.wins) }, title: fr ? "Victoires" : "Wins", symbol: "trophy")
                statistic(value: game.stats.map { String($0.streak) }, title: fr ? "Série" : "Streak", symbol: "flame")
            }
        }
    }

    private func statistic(value: String?, title: String, symbol: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: symbol).font(.system(size: 20)).foregroundColor(Theme.brand)
            Text(value ?? "—").font(.system(size: 25, weight: .bold))
            Text(title).font(.system(size: 12)).foregroundColor(Theme.muted)
        }
        .foregroundColor(Theme.ink).padding(.vertical, 18)
        .frame(maxWidth: .infinity)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
        .accessibilityElement(children: .combine)
    }

    private var themes: some View {
        VStack(alignment: .leading, spacing: 12) {
            NativeSectionTitle(title: fr ? "Mes progressions" : "My progress")
            if game.topicProgress.isEmpty {
                Text(fr ? "Vos niveaux par thème apparaîtront après vos premières parties." : "Your topic levels will appear after your first games.")
                    .font(.system(size: 14)).foregroundColor(.white.opacity(0.95))
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(game.topicProgress.enumerated()), id: \.element.key) { index, topic in
                        if let category = game.categories.first(where: { $0.key == topic.key }) {
                            NavigationLink(value: category) {
                                HStack(spacing: 12) {
                                    NativeTopicArt(category: category).frame(width: 46, height: 46)
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                    Text(NativeCatalog.title(for: category, lang: game.lang))
                                        .font(.system(size: 15, weight: .semibold)).foregroundColor(Theme.ink)
                                    Spacer(minLength: 0)
                                    Text("\(fr ? "Niv." : "Lv.") \(topic.level)")
                                        .font(.system(size: 12, weight: .semibold)).foregroundColor(Theme.brand)
                                    Image(systemName: "chevron.right").font(.system(size: 11)).foregroundColor(Theme.muted)
                                }.padding(14).frame(minHeight: 70)
                            }.buttonStyle(.plain)
                            if index < game.topicProgress.count - 1 { Divider().padding(.horizontal, 14) }
                        }
                    }
                }.background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
            }
        }
    }

    private var friends: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                NativeSectionTitle(title: fr ? "Mes amis" : "My friends")
                Spacer()
                Button(fr ? "Messages" : "Messages", action: onOpenMessages)
                    .font(.system(size: 14, weight: .semibold)).foregroundColor(.white).frame(minHeight: 44)
            }
            if game.friends.isEmpty {
                Text(fr ? "Retrouvez vos amis et vos invitations dans Messages." : "Find your friends and invitations in Messages.")
                    .font(.system(size: 14)).foregroundColor(.white.opacity(0.95))
            } else {
                VStack(spacing: 14) {
                    ForEach(Array(game.friends.prefix(4))) { friend in
                        HStack(spacing: 12) {
                            NativePlayerPortrait(avatar: friend.avatar, size: 42)
                            Text(friend.name).font(.system(size: 15, weight: .semibold)).foregroundColor(Theme.ink)
                            Spacer(minLength: 0)
                            Text(friend.online == true ? (fr ? "En ligne" : "Online") : (fr ? "Hors ligne" : "Offline"))
                                .font(.system(size: 12)).foregroundColor(Theme.muted)
                        }
                    }
                }.padding(16).background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
            }
        }
    }

    private var account: some View {
        VStack(alignment: .leading, spacing: 12) {
            NativeSectionTitle(title: fr ? "Mon compte" : "My account")
            VStack(alignment: .leading, spacing: 10) {
                Text(game.name).font(.system(size: 16, weight: .semibold))
                if let email = auth.user?.email {
                    Text(email).font(.system(size: 14)).foregroundColor(Theme.muted)
                        .textSelection(.enabled)
                }
                Button { showSettings = true } label: {
                    HStack {
                        Label(fr ? "Réglages du compte" : "Account settings", systemImage: "gearshape")
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 12))
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Theme.brand).frame(minHeight: 44)
                }
            }
            .padding(18).frame(maxWidth: .infinity, alignment: .leading)
            .foregroundColor(Theme.ink)
            .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
        }
    }
}

struct NativeSettingsView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        NavigationStack {
            Form {
                Section(fr ? "Préférences" : "Preferences") {
                    Picker(fr ? "Langue" : "Language", selection: Binding(
                        get: { game.lang },
                        set: { if $0 != game.lang { game.toggleLang() } }
                    )) {
                        Text("Français").tag("fr")
                        Text("English").tag("en")
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
                    }.foregroundColor(Theme.brand)
                    Button(role: .destructive) { showDeleteConfirm = true } label: {
                        Label(game.t("deleteAccount"), systemImage: "trash").frame(minHeight: 36)
                    }.disabled(auth.isDeletingAccount)
                    if let error = auth.deleteError {
                        Text(error).font(.subheadline).foregroundColor(Theme.brand)
                            .accessibilityLabel("\(fr ? "Erreur" : "Error"): \(error)")
                    }
                }
                Section(fr ? "À propos" : "About") {
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
                        .overlay(ProgressView(game.t("deleteAccount")).tint(Theme.brand))
                }
            }
            .alert(game.t("deleteAccountConfirmTitle"), isPresented: $showDeleteConfirm) {
                Button(game.t("cancel"), role: .cancel) {}
                Button(game.t("deleteAccountConfirm"), role: .destructive) {
                    Task {
                        await auth.deleteAccount()
                        if auth.user == nil {
                            dismiss()
                            game.resetForSignOut()
                        }
                    }
                }
            } message: {
                Text(game.t("deleteAccountConfirmMessage"))
            }
        }
        .tint(Theme.brand).interactiveDismissDisabled(auth.isDeletingAccount)
    }
}
