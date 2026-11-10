import SwiftUI

struct NativeMessagesView: View {
    @EnvironmentObject var game: GameSocket
    @FocusState private var searchFocused: Bool
    @State private var search = ""
    @State private var roomSheet: NativeRoomSheet.Mode?
    var onBack: () -> Void = {}
    var onInvite: (() -> Void)?
    var onJoin: (() -> Void)?
    var preferredCategory: Category?
    private let accent = Color(hex: 0xAE1536)
    private let line = Color(hex: 0xE8DEDB)
    private var fr: Bool { game.lang == "fr" }
    private var peers: [NativeFriend] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        var ordered = game.conversations.map { conversation in
            game.friends.first(where: { $0.id == conversation.id }) ?? conversation.peer
        }
        let existing = Set(ordered.map(\.id))
        ordered.append(contentsOf: game.friends.filter { !existing.contains($0.id) })
        return ordered.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Rectangle().fill(line).frame(height: 1)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    searchField
                    if let error = game.socialError {
                        Text(error).font(.subheadline).foregroundColor(accent).padding(.top, 12)
                            .accessibilityAddTraits(.updatesFrequently)
                    }
                    if !game.friendRequests.isEmpty { requests.padding(.top, 14) }
                    if game.inboxLoading {
                        Text(fr ? "Chargement des échanges…" : "Loading conversations…")
                            .font(.system(size: 13)).foregroundColor(Theme.muted)
                            .frame(maxWidth: .infinity).padding(.vertical, 24)
                    } else if peers.isEmpty {
                        if search.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            emptyState
                        } else {
                            Text(fr ? "Aucun ami ne correspond à votre recherche." : "No friends match your search.")
                                .font(.system(size: 14)).foregroundColor(Theme.muted)
                                .frame(maxWidth: .infinity).padding(.vertical, 24)
                        }
                    }
                    ForEach(peers) { friend in conversationRow(friend) }
                    NativeFriendInviteButtons(
                        accent: accent, fill: accent, line: accent, filledInk: .white,
                        onInvite: { if let onInvite { onInvite() } else { roomSheet = .create } },
                        onJoin: { if let onJoin { onJoin() } else { roomSheet = .join } }
                    ).padding(.top, 16)
                }
                .padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 24)
                .frame(maxWidth: 600).frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.paper.ignoresSafeArea())
        .foregroundColor(Theme.ink)
        .environment(\.colorScheme, .light)
        .onAppear { game.requestInbox() }
        .onChange(of: game.connected) { if $0 { game.requestInbox() } }
        .sheet(isPresented: Binding(get: { roomSheet != nil }, set: { if !$0 { roomSheet = nil } })) {
            if let roomSheet { NativeRoomSheet(category: nil, mode: roomSheet) }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button(action: onBack) {
                Image(systemName: "arrow.left").font(.system(size: 17, weight: .medium))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(fr ? "Retour" : "Back")
            Text("Messages").font(.system(size: 28, weight: .bold)).tracking(-0.8)
                .accessibilityAddTraits(.isHeader)
            Spacer()
        }
        .padding(.horizontal, 16).padding(.vertical, 18)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").font(.system(size: 16, weight: .medium))
                .foregroundColor(Theme.muted).accessibilityHidden(true)
            TextField("", text: $search, prompt: Text(fr ? "Rechercher un ami" : "Search for a friend").foregroundColor(Theme.muted))
                .font(.system(size: 16)).textInputAutocapitalization(.never)
                .autocorrectionDisabled().focused($searchFocused)
                .accessibilityLabel(fr ? "Rechercher un ami" : "Search for a friend")
            if !search.isEmpty {
                Button { search = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundColor(Theme.muted)
                        .frame(width: 36, height: 44)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(fr ? "Effacer la recherche" : "Clear search")
            }
        }
        .padding(.horizontal, 14).frame(minHeight: 50)
        .background(Color(hex: 0xF1EAE7), in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(searchFocused ? accent : line))
    }

    private var emptyState: some View {
        VStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 26).fill(Color(hex: 0xF5E4E7))
                .frame(width: 76, height: 76).rotationEffect(.degrees(-5))
                .overlay {
                    Image(systemName: "bubble.left").font(.system(size: 32, weight: .medium))
                        .foregroundColor(accent)
                }
                .accessibilityHidden(true)
                .padding(.bottom, 22)
            Text(fr ? "Les belles rivalités commencent ici." : "Great rivalries start here.")
                .font(.system(size: 23, weight: .bold)).tracking(-0.6)
                .accessibilityAddTraits(.isHeader).padding(.bottom, 12)
            Text(fr ? "Invitez un ami, puis échangez et défiez-vous dans votre thème préféré." : "Invite a friend, then chat and challenge each other in your favourite topic.")
                .font(.system(size: 14)).foregroundColor(Theme.muted).lineSpacing(4)
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 12).padding(.top, 50).padding(.bottom, 28)
        .frame(maxWidth: 330).frame(maxWidth: .infinity)
    }

    private var requests: some View {
        DisclosureGroup(fr ? "Demandes d’amis (\(game.friendRequests.count))" : "Friend requests (\(game.friendRequests.count))") {
            ForEach(game.friendRequests) { friend in
                HStack(spacing: 8) {
                    NativePlayerPortrait(avatar: friend.avatar, size: 38)
                    Text(friend.name).font(.headline)
                    Spacer()
                    Button { game.respondToFriend(friend.id, accept: true) } label: {
                        Image(systemName: "checkmark").frame(width: 44, height: 44)
                    }.accessibilityLabel(fr ? "Accepter \(friend.name)" : "Accept \(friend.name)")
                    Button { game.respondToFriend(friend.id, accept: false) } label: {
                        Image(systemName: "xmark").frame(width: 44, height: 44)
                    }.accessibilityLabel(fr ? "Refuser \(friend.name)" : "Decline \(friend.name)")
                }
            }
        }.font(.subheadline.weight(.semibold)).tint(accent)
    }

    private func conversationRow(_ friend: NativeFriend) -> some View {
        let conversation = game.conversations.first(where: { $0.id == friend.id })
        let online = friend.online == true
        return VStack(spacing: 0) {
            NavigationLink(value: NativeBrowseRoute.message(friend, preferredCategory: preferredCategory)) {
                HStack(spacing: 12) {
                    NativePlayerPortrait(avatar: friend.avatar, size: 52)
                        .overlay(alignment: .bottomTrailing) {
                            if online { Circle().fill(Theme.green).frame(width: 10, height: 10).overlay(Circle().strokeBorder(Theme.paper, lineWidth: 2)) }
                        }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(friend.name).font(.system(size: 16, weight: .bold)).tracking(-0.2)
                        Text(preview(for: conversation)).font(.system(size: 14)).foregroundColor(Theme.muted).lineLimit(1)
                        Text(online ? (fr ? "En ligne" : "Online") : (fr ? "Hors ligne" : "Offline"))
                            .font(.system(size: 11)).foregroundColor(Theme.muted)
                    }
                    Spacer(minLength: 0)
                    if let conversation {
                        VStack(alignment: .trailing, spacing: 6) {
                            Text(conversation.lastMessage.date.formatted(date: .omitted, time: .shortened))
                                .font(.system(size: 11)).foregroundColor(Theme.muted)
                            if conversation.unread > 0 {
                                Text("\(min(99, conversation.unread))").font(.caption.bold())
                                    .padding(.horizontal, 7).padding(.vertical, 4)
                                    .foregroundColor(.white).background(accent, in: Capsule())
                            }
                        }
                    }
                }.padding(.vertical, 18).contentShape(Rectangle())
            }.buttonStyle(.plain)
            Rectangle().fill(line).frame(height: 1)
        }
    }

    private func preview(for conversation: NativeConversation?) -> String {
        guard let last = conversation?.lastMessage else { return fr ? "Commencer un échange" : "Start a conversation" }
        return last.kind == "text" ? last.text : (fr ? "Un duel vous attend" : "A duel is waiting")
    }
}

struct NativeFriendInviteButtons: View {
    @EnvironmentObject var game: GameSocket
    var accent: Color = Theme.ink
    var fill: Color = Color(hex: 0xF0E8E5)
    var line: Color = Color(hex: 0xE8DEDB)
    var filledInk: Color = Theme.ink
    let onInvite: () -> Void
    let onJoin: () -> Void
    private var fr: Bool { game.lang == "fr" }

    var body: some View {
        HStack(spacing: 10) {
            action(fr ? "Inviter un ami" : "Invite a friend", filled: true, handler: onInvite)
            action(fr ? "J’ai un code" : "I have a code", filled: false, handler: onJoin)
        }
    }

    private func action(_ title: String, filled: Bool, handler: @escaping () -> Void) -> some View {
        Button(action: handler) {
            Text(title).font(.system(size: 14, weight: .semibold)).multilineTextAlignment(.center)
                .padding(.horizontal, 6).frame(maxWidth: .infinity, minHeight: 50)
                .foregroundColor(filled ? filledInk : accent)
                .background(filled ? fill : Color.clear, in: RoundedRectangle(cornerRadius: 15))
                .overlay(RoundedRectangle(cornerRadius: 15).strokeBorder(line))
        }.buttonStyle(.plain)
    }
}

enum NativeFriendCodeMode: String, Identifiable {
    case share, enter
    var id: String { rawValue }
}

struct NativeFriendCodeSheet: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    @State private var friendCode = ""
    let mode: NativeFriendCodeMode
    private var fr: Bool { game.lang == "fr" }

    var body: some View {
        NavigationStack {
            Form {
                if mode == .share, let id = game.clientId {
                    Section(fr ? "Mon code ami" : "My friend code") {
                        Text(id).font(.footnote.monospaced()).textSelection(.enabled)
                        ShareLink(item: id) { Label(fr ? "Partager mon code" : "Share my code", systemImage: "square.and.arrow.up") }
                    }
                }
                if mode == .enter {
                    Section(fr ? "Code de ton ami" : "Your friend's code") {
                        TextField(fr ? "Coller le code" : "Paste the code", text: $friendCode)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                        Button(fr ? "Envoyer une demande" : "Send friend request") { game.addFriend(friendCode) }
                            .disabled(!game.connected || friendCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
                if let notice = game.socialNotice { Text(notice).foregroundColor(Theme.ink) }
                if let error = game.socialError { Text(error).foregroundColor(Theme.brand) }
            }
            .navigationTitle(fr ? "Ajouter un ami" : "Add a friend")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button(fr ? "Fermer" : "Done") { dismiss() } } }
            .onAppear { game.socialError = nil; game.socialNotice = nil }
        }.tint(Theme.brand).preferredColorScheme(.light)
    }
}

struct NativeMessageThread: View {
    @EnvironmentObject var game: GameSocket
    let friend: NativeFriend
    var preferredCategory: Category?
    @State private var draft = ""
    @State private var pendingDraftID: String?
    @State private var submittedDraft = ""
    private var fr: Bool { game.lang == "fr" }
    private var messages: [NativeMessage] { game.messages[friend.id] ?? [] }
    private var challengeCategories: [Category] {
        let starterKeys = ["spider_man", "harry_potter", "minecraft", "rap_fr", "ligue_champions"]
        let starters = starterKeys.compactMap { key in game.categories.first { $0.key == key && $0.key != preferredCategory?.key } }
        return (preferredCategory.map { [$0] } ?? []) + starters
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    if game.historyHasMore[friend.id] == true {
                        Button(fr ? "Messages précédents" : "Earlier messages") { game.loadEarlierMessages(friend.id) }
                            .frame(minHeight: 44).disabled(game.historyLoading)
                    }
                    if game.historyLoading { ProgressView() }
                    if let error = game.socialError { Text(error).font(.subheadline).foregroundColor(Theme.brand) }
                    ForEach(messages) { message in messageRow(message).id(message.id) }
                }.padding(16)
            }
            .onChange(of: messages.last?.id) { id in if let id { proxy.scrollTo(id, anchor: .bottom) } }
            .onChange(of: game.lastSentMessageID) { id in
                if id == pendingDraftID { if draft == submittedDraft { draft = "" }; pendingDraftID = nil }
            }
        }
        .background(Theme.paper).foregroundColor(Theme.ink)
        .navigationTitle(friend.name).navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(Theme.paper, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.light, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 0) {
                    Menu {
                        ForEach(challengeCategories) { category in
                            Button(NativeCatalog.title(for: category, lang: game.lang)) { game.challengeFriend(friend.id, category: category.key) }
                        }
                    } label: { Image(systemName: "bolt.fill").frame(width: 44, height: 44) }
                    .accessibilityLabel(fr ? "Défier cet ami" : "Challenge this friend")
                    ReportBlockButton(targetId: friend.id, targetName: friend.name, foreground: Theme.muted)
                }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { composer }
        .onAppear { game.conversationOpen = true; game.openConversation(friend.id) }
        .onDisappear { game.conversationOpen = false; game.activeConversation = nil }
    }

    private func messageRow(_ message: NativeMessage) -> some View {
        let own = message.fromId == game.clientId
        return VStack(alignment: own ? .trailing : .leading, spacing: 6) {
            if let challenge = message.challenge {
                VStack(alignment: .leading, spacing: 10) {
                    Label(fr ? "Défi en duel" : "Duel challenge", systemImage: "bolt.fill").font(.headline)
                    Text(NativeCatalog.entry(for: challenge.category)?.label ?? challenge.category).font(.subheadline)
                    if challenge.status == "pending" && challenge.toId == game.clientId {
                        if challenge.mode == "async" {
                            Link(fr ? "Ouvrir ce défi sur le site" : "Open this challenge on the website", destination: URL(string: "https://\(GameSocket.frontendHost)/")!)
                        } else {
                            HStack {
                                Button(fr ? "Accepter" : "Accept") { game.respondToChallenge(challenge.id, accept: true) }
                                Button(fr ? "Refuser" : "Decline") { game.respondToChallenge(challenge.id, accept: false) }
                            }.buttonStyle(.bordered).controlSize(.large)
                        }
                    } else { Text(challenge.status == "pending" ? (fr ? "En attente de réponse" : "Waiting for a reply") : (fr ? "Défi terminé ou accepté" : "Challenge accepted or finished")).font(.caption) }
                }.padding(14).background(Theme.gold.opacity(0.35)).cornerRadius(16)
            } else {
                Text(message.text.isEmpty ? (fr ? "Résultat du duel" : "Duel result") : message.text)
                    .padding(14).background(own ? Theme.brand : Color(hex: 0xEEE5E1)).foregroundColor(own ? .white : Theme.ink).cornerRadius(16)
            }
            Text(message.date.formatted(date: .omitted, time: .shortened)).font(.system(size: 12)).foregroundColor(Theme.muted)
        }.frame(maxWidth: .infinity, alignment: own ? .trailing : .leading)
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField(fr ? "Votre message…" : "Your message…", text: $draft, axis: .vertical)
                .lineLimit(1...4).padding(12).background(Color(hex: 0xEEE5E1)).cornerRadius(14)
                .onChange(of: draft) { value in if value.count > 300 { draft = String(value.prefix(300)) } }
            Button {
                let retryID = draft == submittedDraft ? pendingDraftID : nil
                submittedDraft = draft
                pendingDraftID = game.sendMessage(to: friend.id, text: draft, clientMessageID: retryID)
            } label: {
                if game.pendingMessageID != nil { ProgressView().frame(width: 46, height: 46) }
                else { Image(systemName: "paperplane.fill").frame(width: 46, height: 46) }
            }.background(Theme.gold).foregroundColor(Theme.ink).clipShape(Circle())
                .disabled(!game.connected || game.pendingMessageID != nil || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityLabel(fr ? "Envoyer le message" : "Send message")
        }.padding(12).background(Theme.paper).environment(\.colorScheme, .light)
    }
}
