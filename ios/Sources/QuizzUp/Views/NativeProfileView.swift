import PhotosUI
import SwiftUI

struct NativeProfileView: View {
    private struct Specialty: Identifiable {
        let topic: NativeTopicProgress
        let category: Category
        var id: String { topic.key }
    }

    @EnvironmentObject var game: GameSocket
    @Environment(\.dynamicTypeSize) private var dynamicType
    @State private var showSettings = false
    @State private var showEditor = false
    @State private var showProgressHelp = false
    @State private var showAllFriends = false
    @State private var roomSheet: NativeRoomSheet.Mode?
    @State private var friendCodeSheet: NativeFriendCodeMode?
    var onOpenMessages: () -> Void = {}
    var onSettings: (() -> Void)?
    var onDiscoverTopics: (() -> Void)?
    var onInvite: (() -> Void)?
    var onJoin: (() -> Void)?
    private let line = Theme.separator
    private let soft = Theme.field
    private var fr: Bool { game.lang == "fr" }
    private var level: Int { game.stats?.level ?? 1 }
    private var xpGoal: Int { max(0, game.stats?.xpForLevel ?? 0) }
    private var xp: Int { max(0, min(xpGoal, game.stats?.xpIntoLevel ?? 0)) }
    private var newPlayer: Bool { (game.stats?.games ?? 0) == 0 && specialties.isEmpty }
    private var specialties: [Specialty] {
        let categories = Dictionary(game.categories.map { ($0.key, $0) }, uniquingKeysWith: { first, _ in first })
        return game.topicProgress.compactMap { topic in
            categories[topic.key].map { Specialty(topic: topic, category: $0) }
        }.sorted {
            if $0.topic.level != $1.topic.level { return $0.topic.level > $1.topic.level }
            if ($0.topic.completion ?? 0) != ($1.topic.completion ?? 0) { return ($0.topic.completion ?? 0) > ($1.topic.completion ?? 0) }
            return $0.id < $1.id
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    identity
                    if let error = game.socialError, !showEditor {
                        Text(error).font(.subheadline).foregroundColor(.white)
                    }
                    if newPlayer { firstQuiz }
                    if !specialties.isEmpty { themes }
                    friends
                    publications
                    if !newPlayer { statistics }
                }
                .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                .frame(maxWidth: 600).frame(maxWidth: .infinity)
            }.clipped()
        }
        .background(Theme.pageBackground.ignoresSafeArea())
        .onAppear {
            #if DEBUG && STORE_CAPTURE
            switch StoreCaptureConfiguration.options?.screen {
            case "profile-edit": showEditor = true
            case "profile-help": showProgressHelp = true
            case "profile-friends": showAllFriends = true
            default: break
            }
            #endif
        }
        .refreshable { game.requestProfile() }
        .sheet(isPresented: $showSettings) { NativeSettingsView() }
        .sheet(isPresented: $showEditor) { NativeProfileEditor() }
        .sheet(isPresented: $showProgressHelp) { progressHelp }
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
                Image(systemName: "gearshape").font(.title3)
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(fr ? "Réglages" : "Settings")
        }
        .foregroundColor(.white)
        .padding(.horizontal, 16).padding(.vertical, 8)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
    }

    private var identity: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                NativePlayerPortrait(avatar: game.avatar, size: 60, cornerRadius: 17)
                VStack(alignment: .leading, spacing: 3) {
                    Text(fr ? "MON PROFIL" : "MY PROFILE")
                        .font(.caption2.weight(.heavy)).tracking(1.2).foregroundColor(Theme.muted)
                    Text(game.name).font(.title2.bold()).tracking(-0.6)
                        .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
                }
                Spacer(minLength: 0)
                Button { showEditor = true } label: {
                    Label(fr ? "Modifier" : "Edit", systemImage: "pencil")
                        .font(.caption.weight(.bold)).padding(.horizontal, 10).frame(minHeight: 44)
                        .foregroundColor(Theme.accent).background(soft, in: RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).accessibilityLabel(fr ? "Modifier le profil" : "Edit profile")
            }
            Rectangle().fill(line).frame(height: 1)
            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 6) {
                    Text("\(fr ? "Niveau QuizzUp" : "QuizzUp level") \(level)").font(.subheadline.bold())
                    Spacer(minLength: 0)
                    Button { showProgressHelp = true } label: {
                        Image(systemName: "info.circle").font(.body).frame(width: 44, height: 44)
                    }.buttonStyle(.plain).foregroundColor(Theme.accent)
                        .accessibilityLabel(fr ? "Comprendre les niveaux et l’XP" : "About levels and XP")
                }
                ProgressView(value: Double(xp), total: Double(max(1, xpGoal)))
                    .tint(Theme.accent)
                    .accessibilityLabel(fr ? "Progression vers le niveau \(level + 1)" : "Progress to level \(level + 1)")
                    .accessibilityValue("\(Int(Double(xp) / Double(max(1, xpGoal)) * 100)) %")
                Text(fr ? "Prochain niveau · \(level + 1)" : "Next level · \(level + 1)")
                    .font(.caption).foregroundColor(Theme.muted)
            }
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(Theme.ink)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 21))
    }

    private var progressHelp: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(fr ? "Niveau QuizzUp \(level)" : "QuizzUp level \(level)").font(.title2.bold())
                        Text(fr ? "Ton niveau QuizzUp reflète l’XP gagnée dans l’ensemble de tes parties, tous thèmes confondus. Le score et les bonus de partie font progresser cette expérience." : "Your QuizzUp level reflects the XP earned across all your games and topics. Match scores and bonuses contribute to this experience.")
                        if let stats = game.stats {
                            Text(fr ? "\(stats.xp.formatted()) XP au total" : "\(stats.xp.formatted()) total XP").font(.headline)
                        }
                        if xpGoal > 0 {
                            ProgressView(value: Double(xp), total: Double(xpGoal)).tint(Theme.accent)
                            Text("\(xp.formatted()) / \(xpGoal.formatted()) XP").monospacedDigit()
                            Text(fr ? "Encore \((xpGoal - xp).formatted()) XP pour atteindre le niveau \(level + 1)." : "\((xpGoal - xp).formatted()) XP to reach level \(level + 1).")
                        }
                    }
                    Divider()
                    VStack(alignment: .leading, spacing: 8) {
                        Text(fr ? "Le niveau dans un thème" : "Your level in a topic").font(.headline)
                        Text(fr ? "Chaque spécialité a son propre niveau. Il indique ta progression dans ce thème précis et se distingue de ton niveau QuizzUp global." : "Every specialty has its own level. It tracks your progress in that specific topic, separately from your overall QuizzUp level.")
                    }
                }.font(.body).padding(20).frame(maxWidth: 600).frame(maxWidth: .infinity)
            }
            .foregroundColor(Theme.ink).background(Theme.paper.ignoresSafeArea())
            .navigationTitle(fr ? "Niveaux et expérience" : "Levels and experience")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .navigationBarTrailing) {
                Button(fr ? "Fermer" : "Close") { showProgressHelp = false }.frame(minHeight: 44)
            } }
        }.tint(Theme.accent)
    }

    private var firstQuiz: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(fr ? "À toi de jouer" : "Your turn to play").font(.headline)
            Text(fr ? "Joue ta première partie pour commencer ta collection de spécialités." : "Play your first game to start building your specialties.")
                .font(.subheadline).foregroundColor(Theme.muted)
            if let onDiscoverTopics {
                Button(action: onDiscoverTopics) {
                    Label(fr ? "Choisir mon premier quiz" : "Choose my first quiz", systemImage: "bolt.fill")
                        .font(.subheadline.bold()).padding(.horizontal, 11).frame(minHeight: 44)
                        .foregroundColor(.white).background(Theme.brand, in: RoundedRectangle(cornerRadius: 10))
                }.buttonStyle(.plain).padding(.top, 4)
            }
        }.padding(15).frame(maxWidth: .infinity, alignment: .leading)
            .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
    }

    private var themes: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 3) {
                title(fr ? "Mes spécialités" : "My specialties")
                Text(fr ? "Ton niveau dans chaque quiz" : "Your level in each quiz").font(.caption).foregroundColor(.white.opacity(0.85))
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8, alignment: .top), count: dynamicType.isAccessibilitySize ? 1 : 3), alignment: .leading, spacing: 8) {
                ForEach(specialties.prefix(3)) { item in
                    NavigationLink(value: NativeBrowseRoute.topic(item.category)) {
                        VStack(alignment: .leading, spacing: 0) {
                            NativeTopicArt(category: item.category, ratio: 1.8)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(NativeCatalog.title(for: item.category, lang: game.lang))
                                    .font(.caption.weight(.bold)).lineLimit(2, reservesSpace: true)
                                Text("\(fr ? "Niveau" : "Level") \(item.topic.level)")
                                    .font(.caption.weight(.semibold)).foregroundColor(Theme.accent)
                                    .accessibilityLabel(fr ? "Niveau dans ce thème \(item.topic.level)" : "Level in this topic \(item.topic.level)")
                            }.padding(9).frame(maxWidth: .infinity, alignment: .topLeading)
                        }.foregroundColor(Theme.ink).background(Theme.paper)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }.buttonStyle(.plain)
                }
            }
            if specialties.count > 3 {
                DisclosureGroup {
                    ForEach(specialties.dropFirst(3)) { item in
                        NavigationLink(value: NativeBrowseRoute.topic(item.category)) {
                            HStack {
                                Text(NativeCatalog.title(for: item.category, lang: game.lang)).font(.subheadline.weight(.semibold))
                                Spacer()
                                Text("\(fr ? "Niveau du thème" : "Topic level") \(item.topic.level)").font(.caption)
                            }.padding(.horizontal, 12).frame(minHeight: 44)
                                .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 10))
                        }.buttonStyle(.plain)
                    }
                } label: {
                    Text(fr ? "Mes autres thèmes (\(specialties.count - 3))" : "My other topics (\(specialties.count - 3))")
                        .frame(minHeight: 44)
                }.font(.subheadline.weight(.semibold)).foregroundColor(.white).tint(.white)
            }
        }
    }

    private var friends: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(fr ? "Mes amis" : "My friends").font(.headline).accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                Button { friendCodeSheet = .enter } label: {
                    Label(fr ? "Ajouter un ami" : "Add a friend", systemImage: "plus")
                        .font(.caption.weight(.bold)).frame(minHeight: 44)
                }.buttonStyle(.plain).foregroundColor(Theme.accent)
                Menu {
                    Button(fr ? "Ouvrir les messages" : "Open messages", action: onOpenMessages)
                    Button(fr ? "Partager mon code ami" : "Share my friend code") { friendCodeSheet = .share }
                } label: {
                    Image(systemName: "ellipsis").frame(width: 44, height: 44)
                }.accessibilityLabel(fr ? "Actions pour mes amis" : "Friend actions")
            }
            if game.friends.isEmpty {
                Text(fr ? "Tes amis apparaîtront ici." : "Your friends will appear here.")
                    .font(.subheadline).foregroundColor(Theme.muted)
            } else {
                HStack(alignment: .top, spacing: 8) {
                    ForEach(game.friends.prefix(4)) { friend in
                        NavigationLink(value: NativeBrowseRoute.message(friend, preferredCategory: nil)) {
                            VStack(spacing: 5) {
                                NativePlayerPortrait(avatar: friend.avatar, size: 44)
                                Text(friend.name).font(.caption).lineLimit(1)
                            }.frame(maxWidth: .infinity, minHeight: 66)
                        }.buttonStyle(.plain).accessibilityLabel(fr ? "Écrire à \(friend.name)" : "Message \(friend.name)")
                    }
                }
                DisclosureGroup(isExpanded: $showAllFriends) {
                    ForEach(game.friends) { friend in
                        NavigationLink(value: NativeBrowseRoute.message(friend, preferredCategory: nil)) {
                            HStack(spacing: 10) {
                                NativePlayerPortrait(avatar: friend.avatar, size: 36)
                                Text(friend.name).font(.subheadline.weight(.semibold))
                                Spacer(minLength: 0)
                                Image(systemName: "bubble.left").foregroundColor(Theme.accent)
                            }.padding(8).frame(minHeight: 44).background(soft, in: RoundedRectangle(cornerRadius: 10))
                        }.buttonStyle(.plain)
                    }
                } label: {
                    Text(fr ? "Voir tous (\(game.friends.count))" : "See all (\(game.friends.count))")
                        .font(.subheadline.weight(.semibold)).frame(minHeight: 44)
                }.tint(Theme.accent)
            }
            if !game.friendRequests.isEmpty {
                Button(action: onOpenMessages) {
                    Label(fr ? "Demandes d’amis (\(game.friendRequests.count))" : "Friend requests (\(game.friendRequests.count))", systemImage: "person.badge.plus")
                        .font(.subheadline.weight(.semibold)).frame(minHeight: 44)
                }.buttonStyle(.plain).foregroundColor(Theme.accent)
            }
            NativeFriendInviteButtons(
                onInvite: { if let onInvite { onInvite() } else { roomSheet = .create } },
                onJoin: { if let onJoin { onJoin() } else { roomSheet = .join } }
            )
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
    }

    private var publications: some View {
        NavigationLink(value: NativeBrowseRoute.myPosts) {
            HStack(spacing: 10) {
                Image(systemName: "text.bubble").foregroundColor(Theme.accent)
                Text(fr ? "Mes publications" : "My posts").font(.subheadline.bold())
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundColor(Theme.muted)
            }.padding(.horizontal, 14).frame(minHeight: 54)
                .foregroundColor(Theme.ink).background(Theme.paper, in: RoundedRectangle(cornerRadius: 14))
        }.buttonStyle(.plain)
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
                }.fixedSize(horizontal: false, vertical: true).background(Theme.paper, in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }

    private func statistic(_ value: Int, title: String) -> some View {
        VStack(spacing: 4) {
            Text(value.formatted()).font(.title2.bold()).foregroundColor(Theme.ink)
            Text(title).font(.caption).foregroundColor(Theme.muted)
        }.padding(.vertical, 12).frame(maxWidth: .infinity).accessibilityElement(children: .combine)
    }

    private func title(_ text: String) -> some View {
        Text(text).font(.headline).foregroundColor(.white).accessibilityAddTraits(.isHeader)
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
                                    .overlay(Circle().strokeBorder(avatar == option && photoData == nil ? Theme.accent : .clear, lineWidth: 2))
                            }.buttonStyle(.plain).accessibilityLabel(option.capitalized)
                        }
                    }
                }
                if let error = photoError ?? game.socialError { Text(error).foregroundColor(Theme.accent) }
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
        .tint(Theme.accent).interactiveDismissDisabled(busy)
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
