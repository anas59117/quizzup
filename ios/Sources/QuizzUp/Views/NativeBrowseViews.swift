import SwiftUI
import UIKit

struct NativeSectionTitle: View {
    let title: String
    var body: some View {
        Text(title).font(.system(size: 28, weight: .bold))
            .tracking(-0.7).foregroundColor(.white)
            .accessibilityAddTraits(.isHeader)
    }
}

struct NativeTopicArt: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @EnvironmentObject var game: GameSocket
    let category: Category
    var ratio: CGFloat? = 1
    var detail = false
    var landscape = false
    var tint = Color(hex: 0x241B27)
    @State private var remoteArtwork: (url: URL, image: UIImage)?
    @State private var failedURL: URL?
    private var entry: NativeCatalogEntry? { NativeCatalog.entry(for: category.key) }
    private var fit: Bool { (detail ? entry?.detailFit ?? entry?.fit : entry?.fit) == "contain" }
    private var bundledArtwork: UIImage? {
        entry?.assetName.flatMap { UIImage(named: $0) }
    }
    private var artworkURL: URL? {
        if detail, let source = entry?.detailSrc { return GameSocket.absoluteImageURL(source) }
        if bundledArtwork == nil, let source = entry?.src { return GameSocket.absoluteImageURL(source) }
        return nil
    }
    private var artwork: UIImage? {
        if let url = artworkURL, let image = NativeImageCache.shared.cachedImage(for: url) { return image }
        if let remoteArtwork, remoteArtwork.url == artworkURL { return remoteArtwork.image }
        return bundledArtwork
    }
    private var focal: CGPoint {
        let value = detail ? entry?.detailFocal ?? entry?.focal : entry?.focal
        let tokens = value?.split(separator: " ") ?? []
        return CGPoint(
            x: position(tokens.first, leading: "left", trailing: "right"),
            y: landscape ? 0 : position(tokens.dropFirst().first, leading: "top", trailing: "bottom")
        )
    }

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            ZStack {
                tint
                if let image = artwork {
                    if detail && fit {
                        picture(image, in: size, contain: false)
                            .scaleEffect(1.06).blur(radius: 16).opacity(0.45)
                    }
                    picture(image, in: size, contain: fit).transition(.opacity)
                } else if artworkURL == nil || failedURL == artworkURL {
                    fallback
                } else {
                    Image(systemName: "photo").font(.system(size: 30, weight: .ultraLight))
                        .foregroundColor(.white.opacity(0.18))
                }
            }
            .frame(width: size.width, height: size.height)
            .clipped()
        }
        .aspectRatio(ratio, contentMode: .fit)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: artwork != nil)
        .accessibilityHidden(true)
        .task(id: artworkURL) {
            guard let url = artworkURL, remoteArtwork?.url != url else { return }
            failedURL = nil
            let image = await NativeImageCache.shared.load(url)
            guard !Task.isCancelled else { return }
            if let image { remoteArtwork = (url, image) }
            else { failedURL = url }
        }
    }

    private var fallback: some View {
        Text(NativeCatalog.mark(for: NativeCatalog.title(for: category, lang: game.lang)))
            .font(.system(size: detail ? 78 : 52, weight: .black, design: .rounded))
            .foregroundColor(.white.opacity(0.85)).minimumScaleFactor(0.5).padding(16)
    }

    private func picture(_ image: UIImage, in size: CGSize, contain: Bool) -> some View {
        let horizontal = size.width / max(1, image.size.width)
        let vertical = size.height / max(1, image.size.height)
        let scale = contain ? min(horizontal, vertical) : max(horizontal, vertical)
        let width = image.size.width * scale
        let height = image.size.height * scale
        return Image(uiImage: image).resizable()
            .frame(width: width, height: height)
            .position(
                x: width / 2 + (size.width - width) * focal.x,
                y: height / 2 + (size.height - height) * focal.y
            )
    }

    private func position(_ token: Substring?, leading: String, trailing: String) -> CGFloat {
        guard let token else { return 0.5 }
        if token == leading { return 0 }
        if token == trailing { return 1 }
        if token.hasSuffix("%"), let percent = Double(token.dropLast()) { return CGFloat(percent / 100) }
        return 0.5
    }
}

struct NativeTopicTile: View {
    @EnvironmentObject var game: GameSocket
    let category: Category
    var level: Int? = nil
    var landscape = false
    var suggested = false
    private var fr: Bool { game.lang == "fr" }
    private var title: String { NativeCatalog.title(for: category, lang: game.lang) }

    var body: some View {
        NativeTopicArt(category: category, ratio: landscape ? 1.65 : 1, landscape: landscape)
            .overlay(alignment: .bottom) {
                LinearGradient(colors: [.clear, .black.opacity(0.83)], startPoint: .top, endPoint: .bottom)
                    .frame(height: landscape ? 64 : 80).allowsHitTesting(false)
            }
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(size: landscape ? 13 : 15, weight: .bold))
                        .lineLimit(3).fixedSize(horizontal: false, vertical: true)
                    if let level {
                        Text("\(fr ? "Niveau" : "Level") \(level)").font(.system(size: 12, weight: .medium))
                    }
                }
                .foregroundColor(.white).padding(12)
            }
            .overlay(alignment: .topLeading) {
                if suggested {
                    Text(fr ? "Suggestion" : "Suggested")
                        .font(.system(size: 10)).foregroundColor(.white)
                        .padding(.horizontal, 6).padding(.vertical, 4)
                        .background(Theme.ink.opacity(0.88), in: RoundedRectangle(cornerRadius: 5))
                        .padding(8)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 19))
            .contentShape(RoundedRectangle(cornerRadius: 19))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityValue(level.map { "\(fr ? "Niveau" : "Level") \($0)" } ?? (suggested ? (fr ? "Suggestion" : "Suggested") : ""))
    }
}

struct NativeThemesView: View {
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var game: GameSocket
    @Binding var focusSearch: Bool
    @FocusState private var searchFocused: Bool
    @State private var query = ""
    @State private var family: String?
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private var fr: Bool { game.lang == "fr" }
    private var search: String { query.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var selectedFamily: NativeTopicFamily? { NativeCatalog.families.first { $0.id == family } }
    private var filtered: [Category] {
        if !search.isEmpty {
            return game.categories.filter { NativeCatalog.matches($0, query: search, lang: game.lang) }
        }
        return NativeCatalog.orderedByPopularity(game.categories.filter { NativeCatalog.entry(for: $0.key)?.family == family })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    NativeSectionTitle(title: (search.isEmpty ? selectedFamily?.title(lang: game.lang) : nil)
                                       ?? (fr ? "Tous les thèmes" : "All Topics"))
                    if selectedFamily != nil {
                        Spacer(minLength: 0)
                        Button {
                            family = nil
                            query = ""
                            searchFocused = false
                        } label: {
                            Label(fr ? "Tous les thèmes" : "All topics", systemImage: "arrow.left")
                                .font(.system(size: 13, weight: .semibold)).frame(minHeight: 44)
                        }
                        .buttonStyle(.plain).foregroundColor(.white)
                    }
                }
                .padding(.bottom, 16)
                searchField
                Text(fr ? "Recherche dans tous les thèmes" : "Search across all topics")
                    .font(.system(size: 12)).foregroundColor(.white)
                    .padding(.top, 8).padding(.bottom, 20)
                if game.categories.isEmpty {
                    NativeCatalogEmptyView()
                } else if family == nil && search.isEmpty {
                    familyGrid
                } else if filtered.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(fr ? "Aucun quiz trouvé" : "No quizzes found").font(.headline)
                        Text(fr ? "Essayez un autre nom." : "Try a different name.").font(.subheadline)
                    }
                    .foregroundColor(.white).padding(.vertical, 16)
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(filtered) { category in
                            NavigationLink(value: NativeBrowseRoute.topic(category)) {
                                NativeTopicTile(category: category)
                            }
                            .buttonStyle(.plain)
                            .onAppear {
                                if let index = filtered.firstIndex(where: { $0.key == category.key }) {
                                    NativeImageCache.shared.prefetchCovers(Array(filtered.dropFirst(index + 1).prefix(4)))
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
            .frame(maxWidth: 560).frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear { activateSearch() }
        .onChange(of: focusSearch) { _ in activateSearch() }
        .refreshable { game.loadCategories() }
    }

    init(focusSearch: Binding<Bool>) {
        _focusSearch = focusSearch
        #if DEBUG && STORE_CAPTURE
        if StoreCaptureConfiguration.options?.screen == "family" { _family = State(initialValue: "football") }
        #endif
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(Theme.muted).accessibilityHidden(true)
            TextField("", text: $query, prompt: Text(fr ? "Rechercher un quiz…" : "Search a quiz…").foregroundColor(Theme.muted))
                .font(.system(size: 16)).foregroundColor(Theme.ink)
                .autocorrectionDisabled().submitLabel(.search).focused($searchFocused)
                .accessibilityLabel(fr ? "Rechercher un quiz" : "Search for a quiz")
                .accessibilityHint(fr ? "Recherche dans tous les thèmes" : "Search across all topics")
            if !query.isEmpty {
                Button { query = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundColor(Theme.muted)
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain).accessibilityLabel(fr ? "Effacer la recherche" : "Clear search")
            }
        }
        .padding(.horizontal, 14).frame(minHeight: 50)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
        .tint(Theme.accent)
    }

    private var familyGrid: some View {
        let counts = Dictionary(grouping: game.categories) { NativeCatalog.entry(for: $0.key)?.family ?? "" }.mapValues(\.count)
        return LazyVGrid(columns: columns, spacing: 12) {
            ForEach(NativeCatalog.families) { item in
                let count = counts[item.id, default: 0]
                let palette = familyColors(item.id)
                Button {
                    family = item.id
                    searchFocused = false
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Image(systemName: item.symbol).font(.system(size: 19, weight: .medium))
                            .foregroundColor(palette.0)
                            .frame(width: 40, height: 40)
                            .background(palette.1, in: RoundedRectangle(cornerRadius: 12))
                            .padding(.bottom, 4)
                            .accessibilityHidden(true)
                        Text(item.title(lang: game.lang))
                            .font(.system(size: 16, weight: .bold)).foregroundColor(Theme.ink)
                            .multilineTextAlignment(.leading)
                        Text("\(count) \(fr ? "quiz" : (count == 1 ? "quiz" : "quizzes"))")
                            .font(.system(size: 12)).foregroundColor(Theme.muted)
                    }
                    .padding(14).frame(maxWidth: .infinity, minHeight: 120, alignment: .topLeading)
                    .background(Theme.paper, in: RoundedRectangle(cornerRadius: 20))
                }
                .buttonStyle(.plain).accessibilityElement(children: .combine)
            }
        }
    }

    private func familyColors(_ id: String) -> (Color, Color) {
        if colorScheme == .dark { return (Theme.accent, Theme.accent.opacity(0.14)) }
        let hex: (UInt32, UInt32)
        switch id {
        case "football": hex = (0x28684D, 0xE0EEE4)
        case "culture": hex = (0x276A70, 0xDFEEF0)
        case "cinema": hex = (0x6F466E, 0xF1E3EE)
        case "series": hex = (0x894328, 0xF4E4D7)
        case "sagas": hex = (0x5D4A85, 0xECE5F5)
        case "manga": hex = (0x94412C, 0xF8E4DB)
        case "music": hex = (0x8C325B, 0xF7E0EB)
        case "sport": hex = (0x8B540B, 0xF7EDCB)
        case "gaming": hex = (0x305E89, 0xE0EBF5)
        default: hex = (0xA82543, 0xFAE8ED)
        }
        return (Color(hex: hex.0), Color(hex: hex.1))
    }

    private func activateSearch() {
        guard focusSearch else { return }
        family = nil
        searchFocused = true
        focusSearch = false
    }
}

struct NativeCatalogEmptyView: View {
    @EnvironmentObject var game: GameSocket
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(game.lang == "fr" ? "Le catalogue n’est pas encore chargé." : "The catalogue has not loaded yet.")
                .font(.system(size: 15))
            Button(game.lang == "fr" ? "Charger les thèmes" : "Load themes") { game.loadCategories() }
                .font(.system(size: 15, weight: .bold)).frame(minHeight: 44)
        }
        .foregroundColor(.white).padding(.vertical, 16)
    }
}

struct NativePlaySheet: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    let category: Category?
    @State private var roomMode: NativeRoomSheet.Mode?
    private var fr: Bool { game.lang == "fr" }

    var body: some View {
        Group {
            if let roomMode {
                NativeRoomSheet(category: roomMode == .create ? category : nil, mode: roomMode)
            } else {
                menu
            }
        }
        .background(Theme.paper.ignoresSafeArea())

        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var menu: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(category.map { NativeCatalog.title(for: $0, lang: game.lang) }
                         ?? (fr ? "On joue ?" : "Ready to play?"))
                        .font(.title2.bold()).tracking(-0.6)
                        .accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 0)
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Theme.accent).frame(width: 44, height: 44)
                    }
                    .buttonStyle(.plain).accessibilityLabel(fr ? "Fermer" : "Close")
                }
                .padding(.bottom, 8)
                row(fr ? "Duel rapide" : "Quick duel", subtitle: fr ? "Trouver un adversaire" : "Find an opponent") {
                    start(solo: false)
                }
                row("Solo", subtitle: fr ? "Jouer à ton rythme" : "Play at your own pace") {
                    start(solo: true)
                }
                row(fr ? "Inviter un ami" : "Invite a friend", subtitle: fr ? "Créer une partie privée" : "Create a private game") {
                    roomMode = .create
                }
                row(fr ? "J’ai un code" : "I have a code", subtitle: fr ? "Rejoindre une partie" : "Join a game") {
                    roomMode = .join
                }
            }
            .foregroundColor(Theme.ink)
            .padding(20).frame(maxWidth: 480).frame(maxWidth: .infinity, alignment: .top)
        }
    }

    private func row(_ title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.body.bold()).foregroundColor(Theme.ink)
                    Text(subtitle).font(.footnote).foregroundColor(Theme.muted)
                }
                Spacer(minLength: 0)
                Image(systemName: "arrow.right").foregroundColor(Theme.accent)
            }
            .multilineTextAlignment(.leading)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, minHeight: 65, alignment: .leading)
            .overlay(alignment: .top) { Theme.ink.opacity(0.14).frame(height: 1) }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain).disabled(game.isStarting)
    }

    private func start(solo: Bool) {
        guard !game.isStarting else { return }
        game.soloMode = solo
        dismiss()
        if let category { game.startWithCategory(category.key) } else { game.quickMatch() }
    }
}
