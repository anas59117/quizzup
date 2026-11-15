import SwiftUI

// Direction: compact editorial social feed, crimson masthead over warm paper.
// Rules: adaptive semantic colors, native type, hairline separators, no card wall.
// Signature: edge-to-edge fandom photography anchors the conversation.
struct NativeCommunityView: View {
    @EnvironmentObject private var game: GameSocket
    let category: Category?
    let onClose: () -> Void
    let onSettings: () -> Void
    var mine = false
    @State private var scope = 0
    @State private var topic: String?
    @State private var composer = false
    @State private var composerDraft = ""
    @State private var discussion: NativeCommunityPost?
    private var fr: Bool { game.lang == "fr" }
    private var personalKeys: [String] {
        let valid = Set(game.categories.map(\.key))
        return Array(Set(game.followedThemes + game.topicProgress.map(\.key)))
            .filter { valid.contains($0) }.sorted()
    }
    private var filter: NativeCommunityFilter {
        .init(following: scope == 1, category: topic, topicsOnly: scope == 2, categories: scope == 2 ? personalKeys : [], mine: mine)
    }
    private var topics: [Category] {
        let all = scope == 2 ? game.categories.filter { personalKeys.contains($0.key) } : game.categories
        let featured = Set(NativeCatalog.featuredKeys)
        return all.sorted { (featured.contains($0.key) ? 0 : 1, $0.key) < (featured.contains($1.key) ? 0 : 1, $1.key) }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            if !mine { tabs }
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    topicChips.padding(.vertical, 8)
                    composerPrompt.padding(.horizontal, 16).padding(.vertical, 8)
                    NativeCommunityRule().padding(.horizontal, 16).padding(.top, 8)
                    if let error = game.community.error {
                        Button { game.requestCommunity(filter) } label: {
                            Label(error, systemImage: "arrow.clockwise").font(.subheadline)
                                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        }.padding(.horizontal, 16).foregroundColor(Theme.accent)
                    }
                    if game.community.loading && game.community.posts.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(32)
                    } else if game.community.posts.isEmpty {
                        emptyFeed
                    } else {
                        LazyVStack(spacing: 0) {
                            ForEach(game.community.posts) { post in
                                NativeCommunityPostRow(post: post, onDiscussion: { discussion = post })
                                NativeCommunityRule().padding(.horizontal, 16)
                            }
                        }
                    }
                }
                .frame(maxWidth: 600).frame(maxWidth: .infinity)
                .padding(.bottom, 12)
            }
            .refreshable { game.requestCommunity(filter) }
        }
        .foregroundColor(Theme.ink).background(Theme.contentBackground.ignoresSafeArea()).tint(Theme.accent)
        .onAppear {
            topic = category?.key
            game.requestCommunity(filter)
            #if DEBUG && STORE_CAPTURE
            if StoreCaptureConfiguration.options?.screen == "community-compose" { beginPost() }
            if StoreCaptureConfiguration.options?.screen == "community-suggestion" { beginPost(fr ? "Quel thème vous rend presque imbattable ?" : "Which topic makes you almost unbeatable?") }
            if StoreCaptureConfiguration.options?.screen == "community-discussion", let first = game.community.posts.first { discussion = first }
            #endif
        }
        .onChange(of: filter) { game.requestCommunity($0) }
        .onChange(of: game.connected) { if $0 { game.requestCommunity(filter) } }
        .sheet(isPresented: $composer) { NativeCommunityComposer(initialTopic: topic, initialText: composerDraft) }
        .fullScreenCover(item: $discussion) { NativeCommunityDiscussion(post: $0) }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 8) {
                Button(action: onClose) { Image(systemName: "chevron.left").frame(width: 44, height: 44) }
                    .accessibilityLabel(fr ? "Retour" : "Back")
                NativeBrandLogo(scale: 0.9)
                Spacer(minLength: 0)
                Button(action: onSettings) { Image(systemName: "gearshape").font(.title3).frame(width: 44, height: 44) }
                    .accessibilityLabel(fr ? "Réglages" : "Settings")
            }
            HStack(alignment: .center, spacing: 8) {
                Text(mine ? (fr ? "Mes publications" : "My posts") : (fr ? "Communauté" : "Community")).font(.title2.bold()).tracking(-0.6)
                    .accessibilityAddTraits(.isHeader).fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
                Button { beginPost() } label: {
                    Label(fr ? "Publier" : "Post", systemImage: "plus").font(.subheadline.bold())
                        .padding(.horizontal, 14).frame(minHeight: 44)
                        .foregroundColor(Theme.onGold).background(Theme.gold, in: RoundedRectangle(cornerRadius: 13))
                }
            }.padding(.horizontal, 16).padding(.bottom, 12)
        }
        .buttonStyle(.plain).foregroundColor(.white)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
        .background(Theme.brand.ignoresSafeArea(edges: .top))
    }

    private var tabs: some View {
        HStack(spacing: 0) {
            ForEach(0..<3) { index in
                Button {
                    if scope != index { topic = nil; scope = index }
                } label: {
                    Text([fr ? "Pour toi" : "For you", fr ? "Abonnements" : "Following", fr ? "Mes thèmes" : "My topics"][index])
                        .font(.subheadline.weight(scope == index ? .bold : .medium))
                        .foregroundColor(scope == index ? Theme.accent : Theme.muted)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .overlay(alignment: .bottom) { if scope == index { Capsule().fill(Theme.accent).frame(height: 3).padding(.horizontal, 12) } }
                }.buttonStyle(.plain).accessibilityAddTraits(scope == index ? .isSelected : [])
            }
        }.frame(maxWidth: 600).frame(maxWidth: .infinity).background(Theme.paper)
            .overlay(alignment: .bottom) { NativeCommunityRule() }
    }

    private var topicChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(fr ? "Tous" : "All", key: nil)
                ForEach(topics) { item in chip(NativeCatalog.title(for: item, lang: game.lang), key: item.key) }
            }.padding(.horizontal, 16)
        }
    }

    private func chip(_ title: String, key: String?) -> some View {
        Button { topic = key } label: {
            Text(title).font(.subheadline.weight(topic == key ? .semibold : .regular))
                .padding(.horizontal, 15).frame(minHeight: 44)
                .foregroundColor(topic == key ? .white : Theme.ink)
                .background(topic == key ? Theme.brand : Theme.field, in: RoundedRectangle(cornerRadius: 14))
        }.buttonStyle(.plain).accessibilityAddTraits(topic == key ? .isSelected : [])
    }

    private var composerPrompt: some View {
        HStack(spacing: 10) {
            NativePlayerPortrait(avatar: game.avatar, size: 44)
            Button { beginPost() } label: {
                HStack(spacing: 8) {
                    Text(fr ? "De quoi on parle aujourd’hui ?" : "What’s on your mind?")
                        .font(.subheadline).foregroundColor(Theme.muted).multilineTextAlignment(.leading)
                    Spacer(minLength: 0)
                    Image(systemName: "photo").font(.title3).foregroundColor(Theme.ink)
                }.padding(.horizontal, 13).frame(minHeight: 48)
                    .overlay(RoundedRectangle(cornerRadius: 17).strokeBorder(Theme.controlBorder.opacity(0.55)))
            }.buttonStyle(.plain)
        }
    }

    private var emptyFeed: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(mine ? (fr ? "Ta première publication t’attend." : "Your first post starts here.") : scope == 2 && personalKeys.isEmpty ? (fr ? "Tes thèmes, tes discussions." : "Your topics, your conversations.") : (fr ? "La discussion commence avec toi." : "The conversation starts with you."))
                .font(.headline)
            Text(mine ? (fr ? "Retrouve ici tes publications et leurs commentaires. Partage une question ou un mini-quiz avec la communauté." : "Your posts and their comments live here. Share a question or mini quiz with the community.") : scope == 2 && personalKeys.isEmpty ? (fr ? "Joue ou suis un thème pour retrouver ses publications ici." : "Play or follow a topic to see its posts here.") : (fr ? "Aucune publication pour ce filtre. Partage une question, une photo ou un mini-quiz." : "No posts for this filter yet. Share a question, photo or mini quiz."))
                .font(.subheadline).foregroundColor(Theme.muted)
            Button { beginPost() } label: { Label(fr ? "Lancer la discussion" : "Start a conversation", systemImage: "square.and.pencil").font(.subheadline.bold()).frame(minHeight: 44) }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
    }

    private func beginPost(_ text: String = "") { composerDraft = text; composer = true }
}
