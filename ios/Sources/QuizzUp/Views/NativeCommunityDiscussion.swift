import SwiftUI

struct NativeCommunityDiscussion: View {
    @EnvironmentObject private var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @FocusState private var composerFocused: Bool
    let post: NativeCommunityPost
    @State private var draft = ""
    @State private var sentDraft: String?
    @State private var replyTarget: NativeCommunityReply?
    private var fr: Bool { game.lang == "fr" }
    private var currentPost: NativeCommunityPost { game.community.posts.first { $0.id == post.id } ?? post }
    private var replies: [NativeCommunityReply] { game.community.replies[post.id] ?? [] }
    private var roots: [NativeCommunityReply] {
        let ids = Set(replies.map(\.id))
        return replies.filter { $0.parentId == nil || !ids.contains($0.parentId ?? "") }
    }
    private var pending: Bool { game.community.pendingReply == post.id }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        NativeCommunityPostRow(post: currentPost, showsPreview: false) {
                            if reduceMotion { proxy.scrollTo("comments", anchor: .top) }
                            else { withAnimation { proxy.scrollTo("comments", anchor: .top) } }
                        }
                        NativeCommunityRule().padding(.horizontal, 16)
                        Text(fr ? "\(currentPost.commentsCount) commentaires" : "\(currentPost.commentsCount) comments")
                            .font(.title3.bold()).accessibilityAddTraits(.isHeader)
                            .padding(.horizontal, 16).padding(.top, 16).padding(.bottom, 8).id("comments")
                        if !game.community.loadedReplyPosts.contains(post.id), replies.isEmpty, game.community.error == nil {
                            ProgressView().frame(maxWidth: .infinity).padding(24)
                        } else if replies.isEmpty {
                            Text(fr ? "À toi d’ouvrir la discussion." : "Be the first to join the conversation.")
                                .font(.subheadline).foregroundColor(Theme.muted).padding(16)
                        }
                        LazyVStack(alignment: .leading, spacing: 0) {
                            ForEach(roots) { reply in
                                comment(reply, nested: false)
                                ForEach(replies.filter { $0.parentId == reply.id }) { child in
                                    comment(child, nested: true)
                                }
                                NativeCommunityRule().padding(.horizontal, 16)
                            }
                        }
                        if let error = game.community.error {
                            Button {
                                game.requestCommunityReplies(post.id)
                            } label: { Label(error, systemImage: "arrow.clockwise").font(.subheadline).frame(minHeight: 44) }
                                .foregroundColor(Theme.accent).padding(.horizontal, 16)
                        }
                    }.frame(maxWidth: 600).frame(maxWidth: .infinity)
                }.scrollDismissesKeyboard(.interactively)
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { composer }
        .foregroundColor(Theme.ink).background(Theme.contentBackground.ignoresSafeArea()).tint(Theme.accent)
        .onAppear { game.requestCommunityReplies(post.id) }
        .onChange(of: game.community.hiddenAuthors) { hidden in
            if let author = post.authorId, hidden.contains(author) { dismiss() }
        }
        .onChange(of: game.community.lastReplyID) { id in
            guard id != nil, let sentDraft, draft == sentDraft else { return }
            draft = ""; self.sentDraft = nil; replyTarget = nil
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button { dismiss() } label: { Image(systemName: "chevron.left").font(.title3).frame(width: 44, height: 44) }
                .accessibilityLabel(fr ? "Retour au fil" : "Back to feed")
            Spacer(minLength: 0)
            VStack(spacing: 2) {
                Text("Discussion").font(.headline).accessibilityAddTraits(.isHeader)
                if let key = post.category, let entry = NativeCatalog.entry(for: key) {
                    Text(fr ? entry.label : entry.englishLabel ?? entry.label).font(.caption).foregroundColor(.white)
                }
            }
            Spacer(minLength: 0)
            NativeCommunityModeration(post: currentPost)
        }.buttonStyle(.plain).foregroundColor(.white).padding(.horizontal, 8).padding(.vertical, 6)
            .background(Theme.brand.ignoresSafeArea(edges: .top))
    }

    private func comment(_ reply: NativeCommunityReply, nested: Bool) -> some View {
        HStack(alignment: .top, spacing: 10) {
            NativePlayerPortrait(avatar: reply.authorAvatar, size: nested ? 34 : 42)
            VStack(alignment: .leading, spacing: 4) {
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 5) { author(reply); NativeCommunityDate(date: reply.date).font(.caption).foregroundColor(Theme.muted) }
                    VStack(alignment: .leading, spacing: 2) { author(reply); NativeCommunityDate(date: reply.date).font(.caption).foregroundColor(Theme.muted) }
                }
                Text(reply.text).font(.body).fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 14) {
                    Button { game.reactToCommunityComment(postID: post.id, commentID: reply.id) } label: {
                        Label(reply.reactions.formatted(), systemImage: reply.reacted ? "heart.fill" : "heart")
                            .foregroundColor(reply.reacted ? Theme.accent : Theme.muted)
                            .frame(minWidth: 44, minHeight: 44)
                    }
                    .disabled(game.community.pendingCommentReactions.contains(reply.id))
                    .accessibilityLabel("\(fr ? "J’aime le commentaire" : "Like comment"), \(reply.reactions)")
                    .accessibilityAddTraits(reply.reacted ? .isSelected : [])
                    Button { replyTarget = reply; composerFocused = true } label: {
                        Text(fr ? "Répondre" : "Reply").frame(minHeight: 44)
                    }
                        .disabled(pending).foregroundColor(Theme.muted)
                }.font(.caption).buttonStyle(.plain).frame(minHeight: 44)
            }
        }
        .padding(.leading, nested ? 48 : 16).padding(.trailing, 16).padding(.top, 12)
        .overlay(alignment: .leading) {
            if nested { Rectangle().fill(Theme.separator).frame(width: 1).padding(.leading, 35).padding(.vertical, 8).accessibilityHidden(true) }
        }
    }

    private func author(_ reply: NativeCommunityReply) -> some View {
        HStack(spacing: 6) {
            Text(reply.authorName).font(.subheadline.bold()).fixedSize(horizontal: false, vertical: true)
            if reply.authorId == post.authorId {
                Text(fr ? "Auteur" : "Author").font(.caption2.bold()).foregroundColor(Theme.accent)
                    .padding(.horizontal, 7).padding(.vertical, 3).background(Theme.accent.opacity(0.10), in: Capsule())
            }
        }
    }

    private var composer: some View {
        VStack(spacing: 0) {
            NativeCommunityRule()
            if let target = replyTarget {
                HStack {
                    Text(fr ? "Réponse à \(target.authorName)" : "Replying to \(target.authorName)")
                        .font(.caption).foregroundColor(Theme.muted)
                    Spacer(minLength: 0)
                    Button { replyTarget = nil } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }
                        .accessibilityLabel(fr ? "Annuler la réponse" : "Cancel reply").disabled(pending)
                }.padding(.leading, 16).padding(.trailing, 6)
            }
            HStack(alignment: .bottom, spacing: 9) {
                NativePlayerPortrait(avatar: game.avatar, size: 38).padding(.bottom, 4)
                TextField(fr ? "Ajouter un commentaire…" : "Add a comment…", text: $draft, axis: .vertical)
                    .font(.subheadline).lineLimit(1...5).padding(.horizontal, 12).padding(.vertical, 12)
                    .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Theme.controlBorder.opacity(0.65)))
                    .focused($composerFocused).disabled(pending)
                    .accessibilityLabel(fr ? "Ton commentaire" : "Your comment")
                    .onChange(of: draft) { draft = String($0.prefix(300)) }
                Button {
                    sentDraft = draft
                    game.replyToCommunityPost(post.id, text: draft, parentID: replyTarget.map { $0.parentId ?? $0.id })
                    if game.community.pendingReply != post.id { sentDraft = nil }
                } label: {
                    Group {
                        if pending { ProgressView().tint(Theme.onGold) }
                        else { Image(systemName: "paperplane").font(.title3) }
                    }.frame(width: 46, height: 46).foregroundColor(Theme.onGold).background(Theme.gold, in: Circle())
                }
                .buttonStyle(.plain).disabled(game.community.pendingReply != nil || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityLabel(fr ? "Envoyer le commentaire" : "Send comment")
            }.padding(.horizontal, 12).padding(.vertical, 10)
        }.frame(maxWidth: .infinity).background(Theme.contentBackground)
    }
}
