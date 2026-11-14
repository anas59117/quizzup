import SwiftUI

struct NativeCommunityRule: View {
    var body: some View { Rectangle().fill(Theme.separator).frame(height: 1).accessibilityHidden(true) }
}

struct NativeCommunityPostRow: View {
    @EnvironmentObject private var game: GameSocket
    let post: NativeCommunityPost
    var showsPreview = true
    let onDiscussion: () -> Void
    private var fr: Bool { game.lang == "fr" }
    private var textParts: [String] {
        if let newline = post.text.firstIndex(of: "\n") {
            return [String(post.text[..<newline]), String(post.text[post.text.index(after: newline)...])]
        }
        if let question = post.text.firstIndex(of: "?"), post.text.distance(from: post.text.startIndex, to: question) < 150 {
            let end = post.text.index(after: question)
            return [String(post.text[..<end]), String(post.text[end...]).trimmingCharacters(in: .whitespacesAndNewlines)]
        }
        return [post.text]
    }
    private var shareURL: URL {
        var components = URLComponents(string: "https://quizzup-ten.vercel.app/")!
        components.fragment = "post-" + post.id
        return components.url!
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            NativeCommunityPostHeader(post: post)
            VStack(alignment: .leading, spacing: 4) {
                Text(textParts[0]).font(.title3.bold()).tracking(-0.35)
                    .fixedSize(horizontal: false, vertical: true)
                if textParts.count > 1, !textParts[1].isEmpty {
                    Text(textParts[1]).font(.body).fixedSize(horizontal: false, vertical: true)
                }
            }.frame(maxWidth: .infinity, alignment: .leading)
            if let media = post.mediaUrl { NativeCommunityMedia(path: media) }
            if let question = post.question { quiz(question) }
            HStack(spacing: 22) {
                Button { game.reactToCommunityPost(post.id) } label: {
                    Label(post.reactions.formatted(), systemImage: post.reacted ? "heart.fill" : "heart")
                        .foregroundColor(post.reacted ? Theme.accent : Theme.ink)
                        .frame(minWidth: 44, minHeight: 44)
                }
                .disabled(game.community.pendingReactions.contains(post.id))
                .accessibilityLabel("\(fr ? "J’aime" : "Like"), \(post.reactions)")
                .accessibilityAddTraits(post.reacted ? .isSelected : [])
                Button(action: onDiscussion) { Label(post.commentsCount.formatted(), systemImage: "bubble.left").frame(minWidth: 44, minHeight: 44) }
                    .accessibilityLabel("\(post.commentsCount) \(fr ? "commentaires" : "comments")")
                Spacer(minLength: 0)
                ShareLink(item: shareURL, message: Text(post.text)) {
                    Image(systemName: "arrowshape.turn.up.right").font(.title3).frame(width: 44, height: 44)
                }.accessibilityLabel(fr ? "Partager la publication" : "Share post")
            }
            .font(.subheadline).buttonStyle(.plain)
            .labelStyle(.titleAndIcon).frame(minHeight: 44)
            if showsPreview, let reply = post.lastComment {
                HStack(alignment: .top, spacing: 9) {
                    NativePlayerPortrait(avatar: reply.authorAvatar, size: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        (Text(reply.authorName + " : ").bold() + Text(reply.text))
                            .font(.subheadline).lineLimit(2)
                        viewComments
                    }
                }
            } else if showsPreview, post.commentsCount > 0 { viewComments }
        }
        .foregroundColor(Theme.ink).padding(.horizontal, 16).padding(.vertical, 14)
    }

    private var viewComments: some View {
        Button(action: onDiscussion) {
            Text(fr ? "Voir les \(post.commentsCount) commentaires" : "View \(post.commentsCount) comments")
                .font(.subheadline.weight(.medium)).foregroundColor(Theme.accent)
                .frame(minHeight: 44, alignment: .leading)
        }.buttonStyle(.plain)
    }

    private func quiz(_ question: NativeCommunityQuestion) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(fr ? "Mini-quiz" : "Mini quiz", systemImage: "bolt.fill").font(.caption.bold()).foregroundColor(Theme.accent)
            Text(question.prompt).font(.headline)
            ForEach(Array(question.answers.enumerated()), id: \.offset) { index, answer in
                Button {
                    game.sendCommunity(["type": "post_question_answer", "postId": post.id, "answerIndex": index])
                } label: {
                    HStack {
                        Text(answer).multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                        if game.community.answers[post.id]?.correctIndex == index { Image(systemName: "checkmark.circle.fill").foregroundColor(Theme.green) }
                    }.font(.subheadline).padding(.horizontal, 12).frame(maxWidth: .infinity, minHeight: 44)
                        .background(Theme.field, in: RoundedRectangle(cornerRadius: 10))
                }.buttonStyle(.plain).disabled(game.community.answers[post.id] != nil)
            }
        }.padding(12).overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Theme.separator))
    }
}

struct NativeCommunityPostHeader: View {
    @EnvironmentObject private var game: GameSocket
    let post: NativeCommunityPost
    private var fr: Bool { game.lang == "fr" }
    private var topicTitle: String? {
        guard let key = post.category, let entry = NativeCatalog.entry(for: key) else { return nil }
        return fr ? entry.label : entry.englishLabel ?? entry.label
    }
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            NativePlayerPortrait(avatar: post.displayAvatar, size: 46)
            VStack(alignment: .leading, spacing: 2) {
                Text(post.authorName).font(.headline).fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 4) {
                    if let topicTitle { Text(topicTitle); Text("·") }
                    NativeCommunityDate(date: post.date)
                }.font(.caption).foregroundColor(Theme.muted)
                if post.isDemo == true {
                    Text(fr ? "Compte démo" : "Demo account").font(.caption2.weight(.semibold)).foregroundColor(Theme.muted)
                }
            }
            Spacer(minLength: 0)
            NativeCommunityModeration(post: post)
        }
    }
}

struct NativeCommunityDate: View {
    @EnvironmentObject private var game: GameSocket
    let date: Date
    var body: some View {
        Text(date, style: .relative).accessibilityLabel(Text(date, format: .dateTime.day().month().hour().minute()))
            .environment(\.locale, Locale(identifier: game.lang))
    }
}

struct NativeCommunityMedia: View {
    let path: String
    private var url: URL? {
        if path.hasPrefix("/community-media/") { return URL(string: "https://\(GameSocket.backendHost)\(path)") }
        return GameSocket.absoluteImageURL(path)
    }
    var body: some View {
        if let url {
            AsyncImage(url: url) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFit()
                } else if phase.error != nil {
                    Label("Image", systemImage: "photo").foregroundColor(Theme.muted)
                        .frame(maxWidth: .infinity, minHeight: 80).background(Theme.field)
                } else { ProgressView().frame(maxWidth: .infinity, minHeight: 140).background(Theme.field) }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .accessibilityLabel("Photo")
        }
    }
}

struct NativeCommunityModeration: View {
    @EnvironmentObject private var game: GameSocket
    let post: NativeCommunityPost
    @State private var failed = false
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        Menu {
            if let author = post.authorId, author != game.clientId, post.isDemo != true {
                Button(post.authorFollowed ? (fr ? "Ne plus suivre" : "Unfollow") : (fr ? "Suivre" : "Follow")) {
                    game.sendCommunity(["type": post.authorFollowed ? "unfollow" : "follow", "targetId": author])
                }
                Button(fr ? "Bloquer" : "Block", role: .destructive) {
                    Task {
                        do { try await game.blockUser(targetId: author); game.community.hideAuthor(author) }
                        catch { failed = true }
                    }
                }
            }
            Button(fr ? "Signaler" : "Report", role: .destructive) {
                game.sendCommunity(["type": "post_report", "postId": post.id])
            }.disabled(game.community.reported.contains(post.id))
        } label: { Image(systemName: "ellipsis").font(.title3).frame(width: 44, height: 44) }
        .accessibilityLabel(fr ? "Actions de la publication" : "Post actions")
        .alert(fr ? "Action indisponible" : "Action unavailable", isPresented: $failed) { }
    }
}
