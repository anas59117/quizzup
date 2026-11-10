import PhotosUI
import SwiftUI

struct NativeCommunityView: View {
    @EnvironmentObject private var game: GameSocket
    let category: Category?
    let onClose: () -> Void
    let onSettings: () -> Void
    @State private var following = false
    @State private var topic: String?
    @State private var composer = false
    @State private var discussion: NativeCommunityPost?
    @State private var moderationError = false

    private var fr: Bool { game.lang == "fr" }
    private var filter: NativeCommunityFilter { .init(following: following, category: topic) }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    filters
                    if let error = game.community.error {
                        Button(error) { game.requestCommunity(filter) }.foregroundColor(Theme.brand)
                    }
                    if game.community.loading && game.community.posts.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(.vertical, 36)
                    } else if game.community.posts.isEmpty {
                        emptyFeed
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(game.community.posts) { post in postCard(post) }
                        }
                    }
                }
                .padding(.horizontal, 16).padding(.bottom, 20)
                .frame(maxWidth: 600).frame(maxWidth: .infinity)
            }
            .refreshable { game.requestCommunity(filter) }
        }
        .foregroundColor(Theme.ink)
        .background(Theme.paper.ignoresSafeArea())
        .tint(Theme.brand)
        .onAppear { topic = category?.key; game.requestCommunity(filter) }
        .onChange(of: filter) { game.requestCommunity($0) }
        .onChange(of: game.connected) { if $0 { game.requestCommunity(filter) } }
        .sheet(isPresented: $composer) { NativeCommunityComposer(initialTopic: topic) }
        .sheet(item: $discussion) { NativeCommunityDiscussion(post: $0) }
        .alert(fr ? "Action indisponible" : "Action unavailable", isPresented: $moderationError) { }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button(action: onClose) {
                Image(systemName: "arrow.left").foregroundColor(Theme.brand)
                    .frame(width: 42, height: 42).background(Theme.paper, in: Circle())
            }.accessibilityLabel(fr ? "Retour" : "Back")
            Text(fr ? "Communauté" : "Community").font(.title3.bold()).lineLimit(1).minimumScaleFactor(0.7)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 4)
            Button { composer = true } label: {
                Label(fr ? "Publier" : "Post", systemImage: "plus")
                    .font(.subheadline.bold()).lineLimit(1)
                    .padding(.horizontal, 10).frame(minHeight: 42)
                    .foregroundColor(Theme.ink).background(Theme.gold, in: RoundedRectangle(cornerRadius: 12))
            }
            Button(action: onSettings) {
                Image(systemName: "gearshape").frame(width: 42, height: 42)
                    .background(.white.opacity(0.11), in: Circle())
            }.accessibilityLabel(fr ? "Réglages" : "Settings")
        }
        .buttonStyle(.plain).foregroundColor(.white)
        .padding(.horizontal, 14).padding(.vertical, 7)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
        .background(Theme.brand.ignoresSafeArea(edges: .top))
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 24) {
                filterButton(fr ? "Récents" : "Recent", value: false)
                filterButton(fr ? "Abonnements" : "Following", value: true)
                Spacer(minLength: 0)
            }.overlay(alignment: .bottom) { Divider() }
            Menu {
                Button(fr ? "Tous les thèmes" : "All topics") { topic = nil }
                ForEach(game.categories) { item in
                    Button(NativeCatalog.title(for: item, lang: game.lang)) { topic = item.key }
                }
            } label: {
                Label(topic.flatMap { NativeCatalog.entry(for: $0)?.label } ?? (fr ? "Tous les thèmes" : "All topics"), systemImage: "line.3.horizontal.decrease")
                    .font(.caption.bold()).padding(.horizontal, 12).frame(minHeight: 42)
                    .foregroundColor(Theme.ink)
                    .background(RoundedRectangle(cornerRadius: 10).strokeBorder(Theme.ink.opacity(0.14)))
            }
        }
    }

    private func filterButton(_ title: String, value: Bool) -> some View {
        Button { following = value } label: {
            Text(title).font(.subheadline.bold()).frame(minHeight: 44)
                .foregroundColor(following == value ? Theme.brand : Theme.muted)
                .overlay(alignment: .bottom) {
                    if following == value { Theme.brand.frame(height: 2) }
                }
        }.buttonStyle(.plain).accessibilityAddTraits(following == value ? .isSelected : [])
    }

    private var emptyFeed: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: "bubble.left").foregroundColor(Theme.muted)
            Text(fr ? "Lance la conversation" : "Start the conversation").font(.headline)
            Text(fr ? "Partage une idée, une photo ou un mini-quiz." : "Share an idea, a photo or a mini quiz.")
                .foregroundColor(Theme.muted)
            Button(fr ? "Créer une publication" : "Create a post") { composer = true }
                .font(.subheadline.bold()).frame(minHeight: 44)
        }.padding(.top, 20)
    }

    private func postCard(_ post: NativeCommunityPost) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                NativePlayerPortrait(avatar: post.authorAvatar, size: 36)
                VStack(alignment: .leading, spacing: 3) {
                    Text(post.authorName).font(.subheadline.bold())
                    if let key = post.category, let entry = NativeCatalog.entry(for: key) {
                        Text(fr ? entry.label : entry.englishLabel ?? entry.label).font(.caption).foregroundColor(Theme.muted)
                    }
                }
                Spacer()
                moderation(post)
            }
            Text(post.text).frame(maxWidth: .infinity, alignment: .leading)
            if let media = post.mediaUrl, media.hasPrefix("/community-media/"),
               let url = URL(string: "https://\(GameSocket.backendHost)\(media)") {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFit()
                } placeholder: { ProgressView().frame(maxWidth: .infinity, minHeight: 60) }
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let question = post.question {
                Text(question.prompt).font(.subheadline.bold())
                ForEach(Array(question.answers.enumerated()), id: \.offset) { index, answer in
                    Button(answer) {
                        game.sendCommunity(["type": "post_question_answer", "postId": post.id, "answerIndex": index])
                    }
                    .disabled(game.community.answers[post.id] != nil)
                    .foregroundColor(game.community.answers[post.id]?.correctIndex == index ? Theme.green : Theme.ink)
                    .frame(minHeight: 34)
                }
            }
            HStack(spacing: 20) {
                Button {
                    game.sendCommunity(["type": "post_react", "postId": post.id])
                } label: { Label(post.reactions.formatted(), systemImage: post.reacted ? "heart.fill" : "heart") }
                Button { discussion = post } label: { Label(post.commentsCount.formatted(), systemImage: "bubble.left") }
            }.font(.subheadline).frame(minHeight: 40)
        }
        .padding(14).background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.ink.opacity(0.08)).allowsHitTesting(false) }
    }

    private func moderation(_ post: NativeCommunityPost) -> some View {
        Menu {
            if let author = post.authorId, author != game.clientId {
                Button(post.authorFollowed ? (fr ? "Ne plus suivre" : "Unfollow") : (fr ? "Suivre" : "Follow")) {
                    game.sendCommunity(["type": post.authorFollowed ? "unfollow" : "follow", "targetId": author])
                }
                Button(fr ? "Bloquer" : "Block", role: .destructive) {
                    Task {
                        do { try await game.blockUser(targetId: author); game.community.hideAuthor(author) }
                        catch { moderationError = true }
                    }
                }
            }
            Button(fr ? "Signaler" : "Report", role: .destructive) {
                game.sendCommunity(["type": "post_report", "postId": post.id])
            }.disabled(game.community.reported.contains(post.id))
        } label: {
            Image(systemName: "ellipsis").frame(width: 44, height: 44)
        }.accessibilityLabel(fr ? "Actions de la publication" : "Post actions")
    }
}

private struct NativeCommunityComposer: View {
    @EnvironmentObject private var game: GameSocket
    @EnvironmentObject private var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    let initialTopic: String?
    @State private var topic = ""
    @State private var draft = ""
    @State private var photo: PhotosPickerItem?
    @State private var photoURL: String?
    @State private var uploading = false
    @State private var photoError = false
    @State private var includesQuestion = false
    @State private var prompt = ""
    @State private var answers = Array(repeating: "", count: 4)
    @State private var correct = 0
    private var fr: Bool { game.lang == "fr" }
    private var questionReady: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && answers.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    var body: some View {
        NavigationStack {
            Form {
                Picker(fr ? "Thème" : "Topic", selection: $topic) {
                    Text(fr ? "Aucun thème" : "No topic").tag("")
                    ForEach(game.categories) { item in
                        Text(NativeCatalog.title(for: item, lang: game.lang)).tag(item.key)
                    }
                }
                TextField(fr ? "Ton message" : "Your message", text: $draft, axis: .vertical)
                    .lineLimit(4...8).onChange(of: draft) { draft = String($0.prefix(240)) }
                PhotosPicker(selection: $photo, matching: .images) {
                    Label(photoURL == nil ? (fr ? "Ajouter une photo" : "Add a photo") : (fr ? "Changer la photo" : "Change photo"), systemImage: "photo")
                }.disabled(uploading || game.community.publishing)
                if uploading { ProgressView() }
                if photoError { Text(fr ? "La photo n’a pas pu être chargée." : "The photo could not be uploaded.") }
                Toggle(fr ? "Ajouter un mini-quiz" : "Add a mini quiz", isOn: $includesQuestion)
                if includesQuestion {
                    TextField(fr ? "Question" : "Question", text: $prompt)
                    ForEach(answers.indices, id: \.self) { index in
                        TextField("\(fr ? "Réponse" : "Answer") \(index + 1)", text: $answers[index])
                    }
                    Picker(fr ? "Bonne réponse" : "Correct answer", selection: $correct) {
                        ForEach(answers.indices, id: \.self) { Text(String($0 + 1)).tag($0) }
                    }
                }
                if let error = game.community.error { Text(error) }
                Button(fr ? "Publier" : "Post") {
                    let question: [String: Any]? = includesQuestion ? ["prompt": prompt, "answers": answers, "correctIndex": correct] : nil
                    game.publishCommunityPost(category: topic, text: draft, mediaURL: photoURL, question: question)
                }.disabled(uploading || game.community.publishing || (includesQuestion && !questionReady)
                    || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .navigationTitle(fr ? "Nouvelle publication" : "New post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(fr ? "Fermer" : "Close") { dismiss() } } }
            .onAppear { topic = initialTopic ?? "" }
            .onChange(of: game.community.lastPublishedID) { if $0 != nil { dismiss() } }
            .task(id: photo) {
                guard let photo else { return }
                uploading = true; photoError = false
                defer { if self.photo == photo { uploading = false } }
                do {
                    let data = try await NativeSocialPhoto.prepare(photo)
                    let url = try await NativeSocialPhoto.upload(data, kind: .community, auth: auth)
                    if !Task.isCancelled, self.photo == photo { photoURL = url }
                } catch { if !Task.isCancelled, self.photo == photo { photoError = true } }
            }
        }.preferredColorScheme(.light)
    }
}

private struct NativeCommunityDiscussion: View {
    @EnvironmentObject private var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    let post: NativeCommunityPost
    @State private var draft = ""
    private var fr: Bool { game.lang == "fr" }

    var body: some View {
        NavigationStack {
            List {
                Text(post.text).font(.headline)
                ForEach(game.community.replies[post.id] ?? []) { reply in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(reply.authorName).font(.subheadline.bold())
                        Text(reply.text)
                    }
                }
                TextField(fr ? "Ta réponse" : "Your reply", text: $draft)
                    .onChange(of: draft) { draft = String($0.prefix(300)) }
                Button(fr ? "Répondre" : "Reply") { game.replyToCommunityPost(post.id, text: draft) }
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || game.community.pendingReply != nil)
                if let error = game.community.error { Text(error) }
            }
            .navigationTitle(fr ? "Réponses" : "Replies")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button(fr ? "Fermer" : "Close") { dismiss() } } }
            .onAppear { game.sendCommunity(["type": "post_comments", "postId": post.id]) }
            .onChange(of: game.community.lastReplyID) { if $0 != nil { draft = "" } }
        }.preferredColorScheme(.light)
    }
}
