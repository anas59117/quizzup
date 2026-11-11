import PhotosUI
import SwiftUI

struct NativeProfileView: View {
    private struct Specialty: Identifiable {
        let topic: NativeTopicProgress
        let category: Category
        var id: String { topic.key }
    }

    @EnvironmentObject var game: GameSocket
    @State private var showSettings = false
    @State private var showEditor = false
    @State private var roomSheet: NativeRoomSheet.Mode?
    @State private var friendCodeSheet: NativeFriendCodeMode?
    var onOpenMessages: () -> Void = {}
    var onSettings: (() -> Void)?
    var onDiscoverTopics: (() -> Void)?
    var onInvite: (() -> Void)?
    var onJoin: (() -> Void)?
    private let line = Color(hex: 0xE8DEDB)
    private let soft = Color(hex: 0xF0E8E5)
    private var fr: Bool { game.lang == "fr" }
    private var level: Int { game.stats?.level ?? 1 }
    private var xpGoal: Int { max(0, game.stats?.xpForLevel ?? 0) }
    private var xp: Int { max(0, min(xpGoal, game.stats?.xpIntoLevel ?? 0)) }
    private var newPlayer: Bool { (game.stats?.games ?? 0) == 0 && specialties.isEmpty }
    private var specialties: [Specialty] {
        let categories = Dictionary(game.categories.map { ($0.key, $0) }, uniquingKeysWith: { first, _ in first })
        return game.topicProgress.compactMap { topic in
            categories[topic.key].map { Specialty(topic: topic, category: $0) }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        identity { withAnimation { proxy.scrollTo("profile-friends", anchor: .top) } }
                        if let error = game.socialError, !showEditor {
                            Text(error).font(.system(size: 14)).foregroundColor(.white)
                        }
                        if newPlayer { firstQuiz }
                        if !specialties.isEmpty { themes }
                        friends.id("profile-friends")
                        if !newPlayer { statistics }
                    }
                    .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    .frame(maxWidth: 600).frame(maxWidth: .infinity)
                }
                .clipped()
            }
        }
        .background(Theme.brand.ignoresSafeArea())
        .refreshable { game.requestProfile() }
        .sheet(isPresented: $showSettings) { NativeSettingsView() }
        .sheet(isPresented: $showEditor) { NativeProfileEditor() }
        .sheet(item: $friendCodeSheet) { NativeFriendCodeSheet(mode: $0) }
        .sheet(isPresented: Binding(get: { roomSheet != nil }, set: { if !$0 { roomSheet = nil } })) {
            if let roomSheet { NativeRoomSheet(category: nil, mode: roomSheet) }
        }
    }

    private var header: some View {
        HStack {
            NativeBrandLogo()
            Spacer()
            Button {
                if let onSettings { onSettings() } else { showSettings = true }
            } label: {
                Image(systemName: "gearshape").font(.system(size: 20, weight: .medium))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(fr ? "Réglages" : "Settings")
        }
        .foregroundColor(.white)
        .padding(.horizontal, 16).padding(.vertical, 8)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
    }

    private func identity(onFriends: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 16) {
                NativePlayerPortrait(avatar: game.avatar, size: 68, cornerRadius: 17)
                    .overlay(alignment: .bottomTrailing) {
                        Button { showEditor = true } label: {
                            Image(systemName: "pencil").font(.system(size: 14, weight: .semibold))
                                .foregroundColor(Theme.brand)
                                .frame(width: 32, height: 32).background(soft, in: Circle())
                                .overlay(Circle().strokeBorder(Theme.paper, lineWidth: 2))
                                .frame(width: 44, height: 44).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(fr ? "Modifier le profil" : "Edit profile")
                        .offset(x: 10, y: 12)
                    }
                    .frame(width: 74, alignment: .leading)
                VStack(alignment: .leading, spacing: 3) {
                    Text(fr ? "MON PROFIL" : "MY PROFILE")
                        .font(.system(size: 10, weight: .heavy)).tracking(1.2).foregroundColor(Theme.muted)
                    Text(game.name).font(.system(size: 30, weight: .bold)).tracking(-0.8)
                        .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                }
                Spacer(minLength: 0)
            }
            Rectangle().fill(line).frame(height: 1).padding(.top, 16).padding(.bottom, 13)
            HStack(alignment: .firstTextBaseline) {
                Text("\(fr ? "Niveau" : "Level") \(level)").font(.system(size: 18, weight: .bold))
                Spacer()
                if xpGoal > 0 {
                    Text("\(xp.formatted()) / \(xpGoal.formatted()) XP")
                        .font(.system(size: 12).monospacedDigit()).foregroundColor(Theme.muted)
                }
            }
            if xpGoal > 0 && !newPlayer {
                GeometryReader { geometry in
                    Capsule().fill(soft).overlay(alignment: .leading) {
                        Capsule().fill(Theme.brand).frame(width: geometry.size.width * CGFloat(xp) / CGFloat(xpGoal))
                    }
                }
                .frame(height: 8).padding(.top, 8).accessibilityHidden(true)
                Text(fr ? "\((xpGoal - xp).formatted()) XP avant le niveau \(level + 1)" : "\((xpGoal - xp).formatted()) XP to level \(level + 1)")
                    .font(.system(size: 12)).foregroundColor(Theme.muted).padding(.top, 6)
            } else if !newPlayer {
                Text(fr ? "Joue pour gagner de l’XP." : "Play to earn XP.")
                    .font(.system(size: 12)).foregroundColor(Theme.muted).padding(.top, 6)
            }
            HStack(spacing: 14) {
                Button(action: onFriends) {
                    Label { Text(friendCountLabel).underline() } icon: { Image(systemName: "person.2") }
                        .font(.system(size: 12, weight: .bold)).foregroundColor(Theme.brand)
                        .frame(minHeight: 44)
                }.buttonStyle(.plain)
                if let count = game.stats?.following {
                    Text(fr ? "\(count) \(count == 1 ? "joueur suivi" : "joueurs suivis")" : "\(count) \(count == 1 ? "player followed" : "players followed")")
                        .font(.system(size: 12)).foregroundColor(Theme.muted)
                }
            }.padding(.bottom, -8)
        }
        .padding(17).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(Theme.ink)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 21))
    }

    private var friendCountLabel: String {
        let count = game.friends.count
        return fr ? "\(count) \(count == 1 ? "ami" : "amis")" : "\(count) \(count == 1 ? "friend" : "friends")"
    }

    private var firstQuiz: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(fr ? "À toi de jouer" : "Your turn to play").font(.system(size: 18, weight: .bold))
            Text(fr ? "Joue ta première partie pour commencer ta collection de spécialités." : "Play your first game to start building your specialties.")
                .font(.system(size: 13)).foregroundColor(Theme.muted)
            if let onDiscoverTopics {
                Button(action: onDiscoverTopics) {
                    Label(fr ? "Choisir mon premier quiz" : "Choose my first quiz", systemImage: "bolt.fill")
                        .font(.system(size: 13, weight: .bold)).padding(.horizontal, 11).frame(minHeight: 44)
                        .foregroundColor(.white).background(Theme.brand, in: RoundedRectangle(cornerRadius: 10))
                }.buttonStyle(.plain).padding(.top, 4)
            }
        }.padding(15).frame(maxWidth: .infinity, alignment: .leading)
            .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
    }

    private var themes: some View {
        VStack(alignment: .leading, spacing: 10) {
            title(fr ? "Mes spécialités" : "My specialties")
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8, alignment: .top), count: 3), alignment: .leading, spacing: 8) {
                ForEach(specialties.prefix(3)) { item in
                    NavigationLink(value: NativeBrowseRoute.topic(item.category)) {
                        VStack(alignment: .leading, spacing: 0) {
                            NativeTopicArt(category: item.category, ratio: 1.65)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(NativeCatalog.title(for: item.category, lang: game.lang))
                                    .font(.system(size: 12, weight: .bold)).lineLimit(2)
                                Text("\(fr ? "Niveau" : "Level") \(item.topic.level)")
                                    .font(.system(size: 11, weight: .semibold)).foregroundColor(Theme.brand)
                            }
                            .padding(8).frame(maxWidth: .infinity, minHeight: 52, alignment: .topLeading)
                        }.foregroundColor(Theme.ink).background(Theme.paper)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }.buttonStyle(.plain)
                }
            }
            if specialties.count > 3 {
                DisclosureGroup(fr ? "Mes autres thèmes (\(specialties.count - 3))" : "My other topics (\(specialties.count - 3))") {
                    ForEach(specialties.dropFirst(3)) { item in
                        NavigationLink(value: NativeBrowseRoute.topic(item.category)) {
                            HStack {
                                Text(NativeCatalog.title(for: item.category, lang: game.lang)).font(.system(size: 14, weight: .semibold))
                                Spacer()
                                Text("\(fr ? "Niveau" : "Level") \(item.topic.level)").font(.system(size: 12))
                            }.padding(.horizontal, 12).frame(minHeight: 44)
                                .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 10))
                        }.buttonStyle(.plain)
                    }
                }.font(.system(size: 14, weight: .semibold)).foregroundColor(.white).tint(.white)
            }
        }
    }

    private var friends: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(fr ? "MES AMIS" : "MY FRIENDS").font(.system(size: 11, weight: .heavy)).tracking(1.2)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Menu {
                    Button(fr ? "Ouvrir les messages" : "Open messages", action: onOpenMessages)
                    Button(fr ? "Partager mon code ami" : "Share my friend code") { friendCodeSheet = .share }
                    Button(fr ? "Ajouter par code ami" : "Add by friend code") { friendCodeSheet = .enter }
                } label: {
                    Image(systemName: "ellipsis").font(.system(size: 16, weight: .semibold))
                        .frame(width: 44, height: 36).contentShape(Rectangle())
                }.accessibilityLabel(fr ? "Actions pour mes amis" : "Friend actions")
            }
            if game.friends.isEmpty {
                Text(fr ? "Tes amis apparaîtront ici" : "Your friends will appear here")
                    .font(.system(size: 13, weight: .bold))
                Text(fr ? "Invite un ami pour votre premier duel." : "Invite a friend for your first duel together.")
                    .font(.system(size: 13)).foregroundColor(Theme.muted).fixedSize(horizontal: false, vertical: true)
            } else {
                ForEach(game.friends) { friend in
                    NavigationLink(value: NativeBrowseRoute.message(friend, preferredCategory: nil)) {
                        HStack(spacing: 10) {
                            NativePlayerPortrait(avatar: friend.avatar, size: 36)
                            Text(friend.name).font(.system(size: 14, weight: .semibold))
                            Spacer()
                            Image(systemName: "bubble.left").font(.system(size: 14)).foregroundColor(Theme.brand)
                        }.padding(8).background(soft, in: RoundedRectangle(cornerRadius: 10))
                    }.buttonStyle(.plain)
                }
            }
            NativeFriendInviteButtons(
                onInvite: { if let onInvite { onInvite() } else { roomSheet = .create } },
                onJoin: { if let onJoin { onJoin() } else { roomSheet = .join } }
            ).padding(.top, 4)
        }
        .padding(13).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
    }

    private var statistics: some View {
        VStack(alignment: .leading, spacing: 10) {
            title(fr ? "Statistiques" : "Statistics")
            if let stats = game.stats, stats.games > 0 {
                HStack(spacing: 0) {
                    statistic(stats.games, title: fr ? "Parties" : "Games")
                    Rectangle().fill(line).frame(width: 1)
                    statistic(stats.wins, title: fr ? "Victoires" : "Wins")
                    Rectangle().fill(line).frame(width: 1)
                    statistic(stats.streak, title: fr ? "Série" : "Streak")
                }.frame(height: 70).background(Theme.paper, in: RoundedRectangle(cornerRadius: 14))
            } else {
                Text(fr ? "Tes résultats apparaîtront après ta première partie." : "Your results will appear after your first game.")
                    .font(.system(size: 13)).foregroundColor(.white)
            }
        }
    }

    private func statistic(_ value: Int, title: String) -> some View {
        VStack(spacing: 4) {
            Text(value.formatted()).font(.system(size: 23, weight: .bold)).foregroundColor(Theme.ink)
            Text(title).font(.system(size: 12)).foregroundColor(Theme.muted)
        }.frame(maxWidth: .infinity, maxHeight: .infinity).accessibilityElement(children: .combine)
    }

    private func title(_ text: String) -> some View {
        Text(text).font(.system(size: 18, weight: .bold)).foregroundColor(.white)
            .accessibilityAddTraits(.isHeader)
    }
}

private struct NativeProfileEditor: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var avatar = ""
    @State private var photoItem: PhotosPickerItem?
    @State private var photoData: Data?
    @State private var uploading = false
    @State private var photoError: String?
    @State private var submitted = false
    private var fr: Bool { game.lang == "fr" }
    private var busy: Bool { uploading || game.profileSaving }
    private var cleanName: String {
        String(name.split(whereSeparator: \.isWhitespace).joined(separator: " ").prefix(20))
    }
    private var avatarOptions: [String] {
        let owned = Set(game.stats?.ownedItems ?? [])
        return ["robot", "fox", "brain", "astronaut", "ninja", "dragon", "cat", "owl", "ghost", "lion"]
            .filter { $0 == "robot" || $0 == game.avatar || owned.contains($0) }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(fr ? "Pseudo" : "Display name") {
                    TextField(fr ? "Ton pseudo" : "Your display name", text: $name)
                        .textContentType(.nickname).onChange(of: name) { name = String($0.prefix(20)) }
                }
                Section(fr ? "Photo personnelle" : "Profile photo") {
                    HStack(spacing: 12) {
                        if let photoData, let image = UIImage(data: photoData) {
                            Image(uiImage: image).resizable().scaledToFill().frame(width: 58, height: 58)
                                .clipShape(RoundedRectangle(cornerRadius: 14)).accessibilityHidden(true)
                        } else {
                            NativePlayerPortrait(avatar: avatar, size: 58, cornerRadius: 14)
                        }
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            Label(fr ? "Choisir une photo" : "Choose a photo", systemImage: "photo")
                        }
                    }
                    if photoData != nil || avatar.hasPrefix("/profile-photos/") {
                        Button(fr ? "Retirer la photo" : "Remove photo", role: .destructive) {
                            photoItem = nil
                            photoData = nil
                            avatar = "robot"
                        }
                    }
                }
                Section(fr ? "Choisir un avatar" : "Choose an avatar") {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 52), spacing: 8)], spacing: 8) {
                        ForEach(avatarOptions, id: \.self) { option in
                            Button {
                                photoItem = nil
                                photoData = nil
                                avatar = option
                            } label: {
                                NativePlayerPortrait(avatar: option, size: 44)
                                    .padding(4)
                                    .overlay(Circle().strokeBorder(avatar == option && photoData == nil ? Theme.brand : .clear, lineWidth: 2))
                            }.buttonStyle(.plain).accessibilityLabel(option.capitalized)
                        }
                    }
                }
                if let error = photoError ?? game.socialError { Text(error).foregroundColor(Theme.brand) }
            }
            .disabled(busy)
            .scrollContentBackground(.hidden).background(Theme.paper)
            .navigationTitle(fr ? "Modifier le profil" : "Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(fr ? "Annuler" : "Cancel") { dismiss() }.disabled(busy)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(fr ? "Enregistrer" : "Save", action: save)
                        .disabled(busy || !game.connected || cleanName.isEmpty || (cleanName == game.name && avatar == game.avatar && photoData == nil))
                }
            }
        }
        .tint(Theme.brand).preferredColorScheme(.light).interactiveDismissDisabled(busy)
        .onAppear { name = game.name; avatar = game.avatar; game.socialError = nil }
        .task(id: photoItem) {
            guard let selection = photoItem else { return }
            photoData = nil
            do {
                let data = try await NativeSocialPhoto.prepare(selection)
                guard !Task.isCancelled else { return }
                photoData = data
                photoError = nil
            } catch {
                guard !Task.isCancelled else { return }
                photoItem = nil
                photoError = fr ? "Cette photo ne peut pas être ouverte." : "This photo could not be opened."
            }
        }
        .onChange(of: game.profileSaving) { saving in
            if submitted, !saving, game.socialError == nil, game.name == cleanName, game.avatar == avatar {
                dismiss()
            }
        }
    }

    private func save() {
        photoError = nil
        let draftName = cleanName
        let draftPhoto = photoData
        Task {
            if let draftPhoto {
                uploading = true
                defer { uploading = false }
                do {
                    avatar = try await NativeSocialPhoto.upload(draftPhoto, kind: .profile, auth: auth)
                    photoData = nil
                } catch {
                    photoError = fr ? "La photo n’a pas pu être enregistrée. Réessaie." : "The photo could not be saved. Try again."
                    return
                }
            }
            submitted = game.saveNativeProfile(name: draftName, avatar: avatar)
        }
    }
}

@MainActor
enum NativeSocialPhoto {
    enum Kind {
        case profile, community
        var endpoint: String { self == .profile ? "/profile-photo" : "/community-media" }
        var prefix: String { self == .profile ? "/profile-photos/" : "/community-media/" }
        var key: String { self == .profile ? "avatar" : "mediaUrl" }
    }

    static func prepare(_ item: PhotosPickerItem) async throws -> Data {
        guard let data = try await item.loadTransferable(type: Data.self), data.count <= 12 * 1024 * 1024,
              let image = UIImage(data: data), min(image.size.width, image.size.height) > 0,
              image.size.width * image.size.height * image.scale * image.scale <= 40_000_000 else {
            throw URLError(.cannotDecodeContentData)
        }
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        let output = UIGraphicsImageRenderer(size: CGSize(width: 512, height: 512), format: format).image { context in
            UIColor.white.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 512, height: 512))
            let scale = 512 / min(image.size.width, image.size.height)
            let width = image.size.width * scale
            let height = image.size.height * scale
            image.draw(in: CGRect(x: (512 - width) / 2, y: (512 - height) / 2, width: width, height: height))
        }
        let qualities: [CGFloat] = [0.86, 0.72, 0.56]
        for quality in qualities {
            if let jpeg = output.jpegData(compressionQuality: quality), jpeg.count <= 256 * 1024 { return jpeg }
        }
        throw URLError(.cannotDecodeContentData)
    }

    static func upload(_ jpeg: Data, kind: Kind, auth: AuthManager) async throws -> String {
        guard let token = await auth.getIdToken(), let url = URL(string: "https://\(GameSocket.backendHost)\(kind.endpoint)") else {
            throw URLError(.userAuthenticationRequired)
        }
        var request = URLRequest(url: url, timeoutInterval: 12)
        request.httpMethod = "POST"
        request.httpBody = jpeg
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
              let payload = try JSONSerialization.jsonObject(with: data) as? [String: String],
              let path = payload[kind.key], path.hasPrefix(kind.prefix), path.hasSuffix(".jpg") else {
            throw URLError(.badServerResponse)
        }
        return path
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
        .foregroundColor(Theme.ink).tint(Theme.brand).preferredColorScheme(.light)
        .interactiveDismissDisabled(auth.isDeletingAccount)
    }
}
