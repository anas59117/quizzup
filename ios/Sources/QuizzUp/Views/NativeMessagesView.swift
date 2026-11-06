import SwiftUI

struct NativeMessagesView: View {
    @EnvironmentObject var game: GameSocket
    @State private var search = ""
    @State private var showAdd = false
    @State private var friendCode = ""
    private var fr: Bool { game.lang == "fr" }
    private var peers: [NativeFriend] {
        game.friends.filter { search.isEmpty || $0.name.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Text("Messages").font(.largeTitle.bold())
                    Spacer()
                    Button { showAdd = true } label: { Image(systemName: "person.badge.plus").frame(width: 44, height: 44) }
                        .accessibilityLabel(fr ? "Ajouter un ami" : "Add a friend")
                }
                HStack {
                    Image(systemName: "magnifyingglass")
                    TextField(fr ? "Rechercher un ami" : "Search friends", text: $search)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                }.padding(14).background(Color(hex: 0xEEE5E1)).cornerRadius(14)
                if let error = game.socialError { Text(error).font(.subheadline).foregroundColor(Theme.brand).accessibilityAddTraits(.updatesFrequently) }
                if game.inboxLoading { ProgressView().frame(maxWidth: .infinity) }
                if !game.friendRequests.isEmpty {
                    Text(fr ? "Invitations" : "Friend requests").font(.headline)
                    ForEach(game.friendRequests) { friend in
                        HStack {
                            NativePlayerPortrait(avatar: friend.avatar, size: 44)
                            Text(friend.name).font(.headline)
                            Spacer()
                            Button { game.respondToFriend(friend.id, accept: true) } label: { Image(systemName: "checkmark").frame(width: 44, height: 44) }
                                .accessibilityLabel(fr ? "Accepter \(friend.name)" : "Accept \(friend.name)")
                            Button { game.respondToFriend(friend.id, accept: false) } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }
                                .accessibilityLabel(fr ? "Refuser \(friend.name)" : "Decline \(friend.name)")
                        }
                    }
                }
                if peers.isEmpty && game.friendRequests.isEmpty && !game.inboxLoading {
                    VStack(spacing: 16) {
                        Image(systemName: "bubble.left.and.bubble.right").font(.system(size: 42)).foregroundColor(Theme.brand)
                        Text(fr ? "Les belles rivalités commencent ici." : "Great rivalries start here.")
                            .font(.title2.bold()).multilineTextAlignment(.center)
                        Text(fr ? "Ajoute un ami, échangez et défiez-vous dans votre thème préféré." : "Add a friend, chat and challenge each other on your favourite topic.")
                            .font(.body).foregroundColor(Theme.muted).multilineTextAlignment(.center)
                        Button(fr ? "Ajouter un ami" : "Add a friend") { showAdd = true }
                            .font(.headline).padding(14).frame(maxWidth: .infinity).background(Theme.brand).foregroundColor(.white).cornerRadius(14)
                    }.padding(.vertical, 36)
                }
                ForEach(peers) { friend in
                    NavigationLink(value: friend) {
                        HStack(spacing: 12) {
                            NativePlayerPortrait(avatar: friend.avatar, size: 52)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(friend.name).font(.headline)
                                Text(preview(for: friend)).font(.subheadline).foregroundColor(Theme.muted).lineLimit(1)
                            }
                            Spacer()
                            if let unread = game.conversations.first(where: { $0.id == friend.id })?.unread, unread > 0 {
                                Text("\(min(99, unread))").font(.caption.bold()).padding(7).background(Theme.brand).foregroundColor(.white).clipShape(Circle())
                            }
                            Image(systemName: "chevron.right").font(.caption).foregroundColor(Theme.muted)
                        }.padding(.vertical, 12)
                    }.buttonStyle(.plain)
                    Divider()
                }
            }.padding(20).frame(maxWidth: 600)
        }
        .frame(maxWidth: .infinity).background(Theme.paper).foregroundColor(Theme.ink)
        .navigationDestination(for: NativeFriend.self) { friend in NativeMessageThread(friend: friend) }
        .onAppear { game.requestInbox() }
        .sheet(isPresented: $showAdd) { addFriendSheet }
    }

    private func preview(for friend: NativeFriend) -> String {
        guard let last = game.conversations.first(where: { $0.id == friend.id })?.lastMessage else { return friend.online == true ? (fr ? "En ligne" : "Online") : (fr ? "Commencer une conversation" : "Start a conversation") }
        return last.kind == "text" ? last.text : (fr ? "Un duel vous attend" : "A duel is waiting")
    }

    private var addFriendSheet: some View {
        NavigationStack {
            Form {
                if let id = game.clientId {
                    Section(fr ? "Mon code ami" : "My friend code") {
                        Text(id).font(.footnote.monospaced()).textSelection(.enabled)
                        ShareLink(item: id) { Label(fr ? "Partager mon code" : "Share my code", systemImage: "square.and.arrow.up") }
                    }
                }
                Section(fr ? "Code de ton ami" : "Your friend's code") {
                    TextField(fr ? "Coller le code" : "Paste the code", text: $friendCode)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button(fr ? "Envoyer une demande" : "Send friend request") { game.addFriend(friendCode) }
                        .disabled(!game.connected || friendCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                if let notice = game.socialNotice { Text(notice).foregroundColor(Theme.ink) }
                if let error = game.socialError { Text(error).foregroundColor(Theme.brand) }
            }
            .navigationTitle(fr ? "Ajouter un ami" : "Add a friend")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button(fr ? "Fermer" : "Done") { showAdd = false } } }
        }.tint(Theme.brand)
    }
}

struct NativeMessageThread: View {
    @EnvironmentObject var game: GameSocket
    let friend: NativeFriend
    @State private var draft = ""
    @State private var pendingDraftID: String?
    @State private var submittedDraft = ""
    private var fr: Bool { game.lang == "fr" }
    private var messages: [NativeMessage] { game.messages[friend.id] ?? [] }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 14) {
                    if game.historyLoading { ProgressView() }
                    if let error = game.socialError { Text(error).font(.subheadline).foregroundColor(Theme.brand) }
                    ForEach(messages) { message in messageRow(message).id(message.id) }
                }.padding(16)
            }
            .onChange(of: messages.map(\.id)) { _ in if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) } }
            .onChange(of: game.lastSentMessageID) { id in
                if id == pendingDraftID { if draft == submittedDraft { draft = "" }; pendingDraftID = nil }
            }
        }
        .background(Theme.paper).foregroundColor(Theme.ink)
        .navigationTitle(friend.name).navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(Theme.paper, for: .navigationBar).toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 0) {
                    Menu {
                        ForEach(game.categories.filter { ["spider_man", "harry_potter", "minecraft", "rap_fr", "ligue_champions"].contains($0.key) }) { category in
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
                }.padding(14).background(Theme.gold.opacity(.35)).cornerRadius(16)
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
        }.padding(12).background(Theme.paper)
    }
}
