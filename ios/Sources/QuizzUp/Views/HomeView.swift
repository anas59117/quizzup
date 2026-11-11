import SwiftUI

private enum BrowseTab {
    case home, themes, messages, profile

    var symbol: String {
        switch self {
        case .home: return "house"
        case .themes: return "square.grid.2x2"
        case .messages: return "bubble.left"
        case .profile: return "person"
        }
    }

    func title(fr: Bool) -> String {
        switch self {
        case .home: return fr ? "Accueil" : "Home"
        case .themes: return fr ? "Thèmes" : "Themes"
        case .messages: return "Messages"
        case .profile: return fr ? "Profil" : "Profile"
        }
    }
}

enum NativeBrowseRoute: Hashable {
    case topic(Category)
    case community(Category?)
    case message(NativeFriend, preferredCategory: Category?)
}

struct HomeView: View {
    @EnvironmentObject var game: GameSocket
    @State private var tab: BrowseTab = .home
    @State private var path: [NativeBrowseRoute] = []
    @State private var showSettings = false
    @State private var showPlay = false
    @State private var showRoom = false
    @State private var roomMode: NativeRoomSheet.Mode = .create
    @State private var focusSearch = false
    @State private var messageCategory: Category?
    private var fr: Bool { game.lang == "fr" }
    private var visibleTopic: Category? {
        guard let route = path.last, case let .topic(category) = route else { return nil }
        return category
    }
    private var unread: Int { game.conversations.reduce(0) { $0 + $1.unread } }
    private var browseBackground: Color {
        if let category = visibleTopic {
            let value = NativeCatalog.entry(for: category.key)?.detailTint ?? "#4B2436"
            return Color(hex: UInt32(value.dropFirst(), radix: 16) ?? 0x4B2436)
        }
        return tab == .messages || game.conversationOpen ? Theme.paper : Theme.brand
    }

    var body: some View {
        VStack(spacing: 0) {
            navigation
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            if !game.conversationOpen {
                dock.id(visibleTopic?.key ?? "browse")
            }
        }
        .background(browseBackground.ignoresSafeArea())
        .tint(Theme.brand)
        .preferredColorScheme(tab == .messages || game.conversationOpen ? .light : .dark)
        .sheet(isPresented: $showSettings) { NativeSettingsView() }
        .sheet(isPresented: $showPlay) { NativePlaySheet(category: nil) }
        .sheet(isPresented: $showRoom) {
            NativeRoomSheet(category: nil, mode: roomMode)
                .presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
        }
        .onAppear {
            #if DEBUG && STORE_CAPTURE
            switch StoreCaptureConfiguration.options?.screen {
            case "themes", "family": tab = .themes
            case "messages": tab = .messages
            case "profile", "profile-empty": tab = .profile
            case "community": path = [.community(nil)]
            case "detail":
                if let category = game.categories.first(where: { $0.key == "spider_man" }) {
                    path = [.topic(category)]
                }
            default: break
            }
            #endif
            if game.categories.isEmpty { game.loadCategories() }
            game.requestProfile()
        }
    }

    private var navigation: some View {
        NavigationStack(path: $path) {
            VStack(spacing: 0) {
                if tab == .home || tab == .themes { header }
                Group {
                    switch tab {
                    case .home:
                        NativeHomeContent(onSeeAll: { select(.themes) }, onCommunity: { openCommunity() })
                    case .themes:
                        NativeThemesView(focusSearch: $focusSearch)
                    case .messages:
                        NativeMessagesView(
                            onInvite: { openRoom(.create) },
                            onJoin: { openRoom(.join) },
                            preferredCategory: messageCategory
                        )
                    case .profile:
                        NativeProfileView(
                            onOpenMessages: { select(.messages) },
                            onSettings: { showSettings = true },
                            onDiscoverTopics: { select(.themes) },
                            onInvite: { openRoom(.create) },
                            onJoin: { openRoom(.join) }
                        )
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
            }
            .background(Theme.brand.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: NativeBrowseRoute.self) { route in
                switch route {
                case let .topic(category):
                    NativeTopicDetail(
                        category: category,
                        onBack: closeRoute,
                        onSettings: { showSettings = true },
                        onChallenge: {
                            select(.messages)
                            messageCategory = category
                        },
                        onCommunity: { openCommunity(category) }
                    )
                case let .community(category):
                    NativeCommunityView(category: category, onClose: closeRoute, onSettings: { showSettings = true })
                        .toolbar(.hidden, for: .navigationBar)
                case let .message(friend, preferredCategory):
                    NativeMessageThread(friend: friend, preferredCategory: preferredCategory)
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 2) {
            NativeBrandLogo()
            Spacer(minLength: 12)
            if tab == .home {
                Button { openCommunity() } label: {
                    Image(systemName: "person.2")
                        .font(.system(size: 21)).frame(width: 44, height: 44)
                }
                .accessibilityLabel(fr ? "Communauté" : "Community")
                Button {
                    select(.themes)
                    focusSearch = true
                } label: {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 22)).frame(width: 44, height: 44)
                }
                .accessibilityLabel(fr ? "Rechercher un quiz" : "Search quizzes")
            }
            Button { showSettings = true } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 22)).frame(width: 44, height: 44)
            }
            .accessibilityLabel(fr ? "Réglages" : "Settings")
        }
        .buttonStyle(.plain)
        .foregroundColor(.white)
        .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, tab == .home ? 12 : 20)
        .frame(maxWidth: 560).frame(maxWidth: .infinity)
        .background(Theme.brand)
    }

    private var dock: some View {
        let dark = visibleTopic != nil
        return HStack(spacing: 0) {
            dockItem(.home, dark: dark)
            dockItem(.themes, dark: dark)
            Button { showPlay = true } label: {
                VStack(spacing: 4) {
                    Image(systemName: "bolt")
                        .font(.system(size: 24, weight: .semibold))
                    Text(fr ? "Jouer" : "Play")
                        .font(.system(size: 11, weight: .heavy))
                }
                .foregroundColor(Color(hex: 0x231900))
                .frame(width: 50, height: 58)
                .background(Theme.gold, in: RoundedRectangle(cornerRadius: 19))
                .offset(y: -5)
                .frame(maxWidth: .infinity, minHeight: 61)
                .contentShape(Rectangle())
            }
            .disabled(game.isStarting)
            dockItem(.messages, dark: dark)
            dockItem(.profile, dark: dark)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 4).padding(.vertical, 5)
        .background(dark ? Color(hex: 0x291B24) : Theme.paper, in: RoundedRectangle(cornerRadius: 26))
        .overlay {
            RoundedRectangle(cornerRadius: 26)
                .strokeBorder(dark ? .white.opacity(0.15) : Theme.ink.opacity(0.12))
                .allowsHitTesting(false)
        }
        .shadow(color: .black.opacity(0.15), radius: 11, x: 0, y: 5)
        .padding(.horizontal, 10).padding(.top, 4).padding(.bottom, 3)
        .frame(maxWidth: 680).frame(maxWidth: .infinity)
    }

    private func dockItem(_ item: BrowseTab, dark: Bool) -> some View {
        let active = tab == item
        let color = active ? (dark ? Color(hex: 0xFFE296) : Theme.brand) : (dark ? Color(hex: 0xD3BDC6) : Theme.muted)
        let messageCount = item == .messages ? unread : 0
        return Button { select(item) } label: {
            VStack(spacing: 5) {
                Image(systemName: item.symbol)
                    .font(.system(size: 21, weight: .medium))
                    .overlay(alignment: .topTrailing) {
                        if messageCount > 0 {
                            Text(messageCount > 99 ? "99+" : String(messageCount))
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 4).frame(minWidth: 16, minHeight: 16)
                                .background(Theme.brand, in: Capsule())
                                .offset(x: 10, y: -5)
                                .accessibilityHidden(true)
                        }
                    }
                Text(item.title(fr: fr))
                    .font(.system(size: 10, weight: active ? .bold : .medium))
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .foregroundColor(color)
            .frame(maxWidth: .infinity, minHeight: 59)
            .contentShape(Rectangle())
        }
        .accessibilityAddTraits(active ? .isSelected : [])
        .accessibilityValue(messageCount > 0 ? (fr ? "\(messageCount) non lus" : "\(messageCount) unread") : "")
    }

    private func select(_ destination: BrowseTab) {
        path.removeAll()
        tab = destination
        messageCategory = nil
        if destination == .profile || destination == .messages { game.requestProfile() }
    }

    private func openRoom(_ mode: NativeRoomSheet.Mode) {
        roomMode = mode
        showRoom = true
    }

    private func openCommunity(_ category: Category? = nil) {
        path.append(.community(category))
    }

    private func closeRoute() {
        if !path.isEmpty { path.removeLast() }
    }
}

private struct NativeHomeContent: View {
    @EnvironmentObject var game: GameSocket
    let onSeeAll: () -> Void
    let onCommunity: () -> Void
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private var fr: Bool { game.lang == "fr" }
    private var personalKeys: Set<String> { Set(game.followedThemes + game.topicProgress.map(\.key)) }
    private var ordered: [Category] {
        let keys = game.followedThemes + game.topicProgress.map(\.key) + NativeCatalog.featuredKeys
        let byKey = Dictionary(game.categories.map { ($0.key, $0) }, uniquingKeysWith: { first, _ in first })
        var seen = Set<String>()
        return (keys.compactMap { byKey[$0] } + game.categories).filter { seen.insert($0.key).inserted }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 9) {
                    HStack {
                        NativeSectionTitle(title: fr ? "Mes thèmes" : "My themes")
                        Spacer(minLength: 6)
                        Button(action: onSeeAll) {
                            HStack(spacing: 5) {
                                Text(fr ? "Tout voir" : "See all").font(.system(size: 14, weight: .medium))
                                Image(systemName: "arrow.right").font(.system(size: 13))
                            }
                            .frame(minHeight: 44)
                        }
                        .buttonStyle(.plain).foregroundColor(.white)
                    }
                    if personalKeys.isEmpty {
                        Text(fr ? "Quelques idées pour commencer" : "Suggestions to get started")
                            .font(.system(size: 12)).foregroundColor(Color(hex: 0xFFF1EC))
                    }
                    if ordered.isEmpty {
                        NativeCatalogEmptyView()
                    } else {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(Array(ordered.prefix(4))) { category in
                                NavigationLink(value: NativeBrowseRoute.topic(category)) {
                                    NativeTopicTile(
                                        category: category,
                                        level: game.topicProgress.first { $0.key == category.key }?.level,
                                        suggested: !personalKeys.isEmpty && !personalKeys.contains(category.key)
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                if ordered.count > 4 {
                    VStack(alignment: .leading, spacing: 9) {
                        NativeSectionTitle(title: fr ? "À découvrir" : "Discover")
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(Array(ordered.dropFirst(4).prefix(2))) { category in
                                NavigationLink(value: NativeBrowseRoute.topic(category)) {
                                    NativeTopicTile(category: category, landscape: true)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                communityTeaser
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
            .frame(maxWidth: 560).frame(maxWidth: .infinity)
        }
        .refreshable { game.loadCategories(); game.requestProfile() }
    }

    private var communityTeaser: some View {
        Button(action: onCommunity) {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(fr ? "Communauté" : "Community")
                        .font(.system(size: 16, weight: .bold)).tracking(-0.25)
                    if let post = game.community.latestPost {
                        HStack(spacing: 10) {
                            NativePlayerPortrait(avatar: post.authorAvatar, size: 44)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(post.authorName).font(.system(size: 14, weight: .bold))
                                if let category = game.categories.first(where: { $0.key == post.category }) {
                                    Text(NativeCatalog.title(for: category, lang: game.lang))
                                        .font(.system(size: 11)).foregroundColor(Theme.muted)
                                }
                                if !post.text.isEmpty {
                                    Text(post.text).font(.system(size: 13)).lineLimit(2)
                                }
                            }
                        }
                        .padding(.top, 4)
                    } else {
                        Text(fr ? "Rejoindre les discussions" : "Join the discussions")
                            .font(.system(size: 13)).foregroundColor(Theme.muted)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "arrow.right").font(.system(size: 17)).foregroundColor(Theme.brand)
            }
            .multilineTextAlignment(.leading).foregroundColor(Theme.ink).padding(16)
            .frame(maxWidth: .infinity, minHeight: 80, alignment: .leading)
            .background(Theme.paper, in: RoundedRectangle(cornerRadius: 19))
        }
        .buttonStyle(.plain)
    }
}
