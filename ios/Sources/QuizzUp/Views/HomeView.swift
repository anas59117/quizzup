// Direction: warm editorial, matching the website's red browse canvas.
// Rules: ivory controls, outlined symbols, true account data.
// Signature: four equal cinematic covers with readable bottom captions.
import SwiftUI

private enum BrowseTab: String {
    case home, themes, messages, profile
    var symbol: String {
        switch self {
        case .home: return "house"
        case .themes: return "square.grid.2x2"
        case .messages: return "bubble.left.and.bubble.right"
        case .profile: return "person.crop.circle"
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

struct HomeView: View {
    @EnvironmentObject var game: GameSocket
    @State private var tab: BrowseTab = .home
    @State private var path = NavigationPath()
    @State private var showSettings = false
    @State private var showPlay = false
    @State private var focusSearch = false
    private var fr: Bool { game.lang == "fr" }

    var body: some View {
        NavigationStack(path: $path) {
            VStack(spacing: 0) {
                header
                Group {
                    switch tab {
                    case .home: NativeHomeContent(onSeeAll: { select(.themes) })
                    case .themes: NativeThemesView(focusSearch: $focusSearch)
                    case .messages: NativeMessagesView()
                    case .profile: NativeProfileView(onOpenMessages: { select(.messages) })
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .background(Theme.brand.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: Category.self) { category in
                NativeTopicDetail(category: category)
            }
        }
        .tint(Theme.brand)
        .safeAreaInset(edge: .bottom, spacing: 0) { if !game.conversationOpen { dock } }
        .sheet(isPresented: $showSettings) { NativeSettingsView() }
        .sheet(isPresented: $showPlay) { NativePlaySheet(category: nil) }
        .onAppear {
            #if DEBUG && STORE_CAPTURE
            switch StoreCaptureConfiguration.options?.screen {
            case "themes": tab = .themes
            case "messages": tab = .messages
            case "profile": tab = .profile
            default: break
            }
            #endif
            if game.categories.isEmpty { game.loadCategories() }
            game.requestProfile()
        }
    }

    private var header: some View {
        HStack(spacing: 0) {
            NativeBrandLogo()
            Spacer(minLength: 12)
            Button {
                select(.themes)
                focusSearch = true
            } label: {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 22)).frame(width: 44, height: 44)
            }
            .accessibilityLabel(fr ? "Rechercher un thème" : "Search themes")
            Button { showSettings = true } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 22)).frame(width: 44, height: 44)
            }
            .accessibilityLabel(fr ? "Réglages" : "Settings")
        }
        .foregroundColor(.white)
        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 16)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
        .background(Theme.brand)
    }

    private var dock: some View {
        HStack(spacing: 0) {
            dockItem(.home)
            dockItem(.themes)
            Button { showPlay = true } label: {
                VStack(spacing: 3) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 23, weight: .bold))
                        .frame(width: 48, height: 44)
                        .background(Theme.gold, in: RoundedRectangle(cornerRadius: 15))
                    Text(fr ? "Jouer" : "Play").font(.system(size: 11, weight: .bold))
                }
                .foregroundColor(Theme.ink)
                .frame(maxWidth: .infinity, minHeight: 62)
                .contentShape(Rectangle())
            }
            .disabled(game.isStarting)
            dockItem(.messages)
            dockItem(.profile)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 6).padding(.top, 8).padding(.bottom, 2)
        .frame(maxWidth: 600).frame(maxWidth: .infinity)
        .background(Theme.paper.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) { Theme.ink.opacity(0.12).frame(height: 1) }
    }

    private func dockItem(_ item: BrowseTab) -> some View {
        Button { select(item) } label: {
            VStack(spacing: 6) {
                Image(systemName: item.symbol)
                    .font(.system(size: 22, weight: tab == item ? .semibold : .regular))
                Text(item.title(fr: fr))
                    .font(.system(size: 10, weight: tab == item ? .bold : .medium))
            }
            .foregroundColor(tab == item ? Theme.brand : Theme.muted)
            .frame(maxWidth: .infinity, minHeight: 62).contentShape(Rectangle())
        }
        .accessibilityAddTraits(tab == item ? .isSelected : [])
    }

    private func select(_ destination: BrowseTab) {
        path = NavigationPath()
        tab = destination
        if destination == .profile || destination == .messages { game.requestProfile() }
    }
}

private struct NativeHomeContent: View {
    @EnvironmentObject var game: GameSocket
    let onSeeAll: () -> Void
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private var fr: Bool { game.lang == "fr" }
    private var personalKeys: [String] {
        var seen = Set<String>()
        return (game.followedThemes + game.topicProgress.map(\.key)).filter { seen.insert($0).inserted }
    }
    private var ordered: [Category] {
        let keys = personalKeys + NativeCatalog.featuredKeys
        var seen = Set<String>()
        let preferred = keys.compactMap { key in game.categories.first { $0.key == key } }
        return (preferred + game.categories).filter { seen.insert($0.key).inserted }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        NativeSectionTitle(title: fr ? "Mes thèmes" : "My themes")
                        Spacer(minLength: 6)
                        Button(action: onSeeAll) {
                            HStack(spacing: 5) {
                                Text(fr ? "Tout voir" : "See all").font(.system(size: 14, weight: .medium))
                                Image(systemName: "arrow.right").font(.system(size: 13))
                            }.frame(minHeight: 44)
                        }.foregroundColor(.white)
                    }
                    if personalKeys.isEmpty {
                        Text(fr ? "Quelques idées pour commencer" : "Suggestions to get started")
                            .font(.system(size: 13)).foregroundColor(.white.opacity(0.9))
                    }
                    if ordered.isEmpty {
                        NativeCatalogEmptyView()
                    } else {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(Array(ordered.prefix(4))) { category in
                                NavigationLink(value: category) {
                                    NativeTopicTile(category: category, level: game.topicProgress.first { $0.key == category.key }?.level)
                                }.buttonStyle(.plain)
                            }
                        }
                    }
                }
                if ordered.count > 4 {
                    VStack(alignment: .leading, spacing: 12) {
                        NativeSectionTitle(title: fr ? "À découvrir" : "Discover")
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(Array(ordered.dropFirst(4).prefix(2))) { category in
                                NavigationLink(value: category) { NativeTopicTile(category: category) }
                                    .buttonStyle(.plain)
                            }
                        }
                    }
                }
                Link(destination: URL(string: "https://\(GameSocket.frontendHost)/")!) {
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(fr ? "Communauté" : "Community").font(.system(size: 17, weight: .bold))
                            Text(fr ? "Rejoindre les discussions sur le site" : "Join the discussions on the website")
                                .font(.system(size: 13)).foregroundColor(Theme.muted)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "arrow.up.right").foregroundColor(Theme.brand)
                    }
                    .foregroundColor(Theme.ink).padding(18)
                    .frame(maxWidth: .infinity, minHeight: 84, alignment: .leading)
                    .background(Theme.paper, in: RoundedRectangle(cornerRadius: 19))
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
            .frame(maxWidth: 600).frame(maxWidth: .infinity)
        }
        .refreshable { game.loadCategories(); game.requestProfile() }
    }
}
