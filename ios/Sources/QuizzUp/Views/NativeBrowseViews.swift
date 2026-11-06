// Direction: the website's cover-led editorial catalogue, translated to SwiftUI.
// Rules: square artwork, quiet native controls, meaningful empty states.
// Signature: readable HTML-equivalent captions over cinematic covers.
import SwiftUI

struct NativeSectionTitle: View {
    let title: String
    var body: some View {
        Text(title).font(.system(size: 28, weight: .bold))
            .tracking(-0.7).foregroundColor(.white)
            .accessibilityAddTraits(.isHeader)
    }
}

struct NativeTopicArt: View {
    let category: Category
    @EnvironmentObject var game: GameSocket
    private var entry: NativeCatalogEntry? { NativeCatalog.entry(for: category.key) }
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color(hex: 0x241B27)
                Text(NativeCatalog.mark(for: NativeCatalog.title(for: category, lang: game.lang)))
                    .font(.system(size: 54, weight: .black, design: .rounded))
                    .foregroundColor(.white.opacity(0.85)).minimumScaleFactor(0.5)
                    .padding(16)
                if let src = entry?.src, let url = GameSocket.absoluteImageURL(src) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable()
                                .aspectRatio(contentMode: entry?.fit == "contain" ? .fit : .fill)
                                .frame(width: geometry.size.width, height: geometry.size.height)
                                .background(Color(hex: 0x141217))
                        }
                    }
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }
}

struct NativeTopicTile: View {
    @EnvironmentObject var game: GameSocket
    let category: Category
    var level: Int? = nil
    private var title: String { NativeCatalog.title(for: category, lang: game.lang) }
    var body: some View {
        NativeTopicArt(category: category)
            .overlay(alignment: .bottom) {
                LinearGradient(colors: [.clear, .black.opacity(0.86)], startPoint: .top, endPoint: .bottom)
                    .frame(height: 86).allowsHitTesting(false)
            }
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.system(size: 15, weight: .bold))
                        .lineLimit(3).fixedSize(horizontal: false, vertical: true)
                    if let level {
                        Text("\(game.lang == "fr" ? "Niveau" : "Level") \(level)")
                            .font(.system(size: 12, weight: .medium))
                    }
                }
                .foregroundColor(.white).padding(12)
            }
            .clipShape(RoundedRectangle(cornerRadius: 19))
            .contentShape(RoundedRectangle(cornerRadius: 19))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityValue(level.map { "\(game.lang == "fr" ? "Niveau" : "Level") \($0)" } ?? "")
    }
}

struct NativeThemesView: View {
    @EnvironmentObject var game: GameSocket
    @Binding var focusSearch: Bool
    @FocusState private var searchFocused: Bool
    @State private var query = ""
    @State private var family: String?
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
    private var fr: Bool { game.lang == "fr" }
    private var selectedFamily: NativeTopicFamily? { NativeCatalog.families.first { $0.id == family } }
    private var filtered: [Category] {
        game.categories.filter { category in
            (family == nil || family == "all" || NativeCatalog.entry(for: category.key)?.family == family)
                && (query.trimmingCharacters(in: .whitespaces).isEmpty || NativeCatalog.matches(category, query: query.trimmingCharacters(in: .whitespaces), lang: game.lang))
        }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if family != nil {
                    Button {
                        family = nil
                        query = ""
                        searchFocused = false
                    } label: {
                        Label(fr ? "Toutes les familles" : "All categories", systemImage: "arrow.left")
                            .font(.system(size: 14, weight: .medium)).frame(minHeight: 44)
                    }.foregroundColor(.white)
                }
                NativeSectionTitle(title: selectedFamily?.title(lang: game.lang) ?? (fr ? "Thèmes" : "Themes"))
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundColor(Theme.muted)
                    TextField(fr ? "Rechercher un thème…" : "Search themes…", text: $query)
                        .font(.system(size: 16)).foregroundColor(Theme.ink)
                        .autocorrectionDisabled().submitLabel(.search)
                        .focused($searchFocused)
                    if !query.isEmpty {
                        Button { query = "" } label: {
                            Image(systemName: "xmark.circle.fill").foregroundColor(Theme.muted)
                                .frame(width: 36, height: 44)
                        }.accessibilityLabel(fr ? "Effacer la recherche" : "Clear search")
                    }
                }
                .padding(.horizontal, 14).frame(minHeight: 52)
                .background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
                if game.categories.isEmpty {
                    NativeCatalogEmptyView()
                } else if family == nil && query.isEmpty {
                    familyGrid
                    Button { family = "all" } label: {
                        Label(fr ? "Tous les thèmes" : "All themes", systemImage: "square.grid.2x2")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity, minHeight: 50)
                    }
                    .foregroundColor(Theme.ink)
                    .background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
                } else if filtered.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(fr ? "Aucun thème trouvé" : "No themes found").font(.headline)
                        Text(fr ? "Essayez un autre nom ou une autre famille." : "Try another name or category.")
                            .font(.subheadline)
                    }.foregroundColor(.white).padding(.vertical, 16)
                } else {
                    Text("\(filtered.count) \(fr ? "thèmes" : "themes")")
                        .font(.system(size: 13)).foregroundColor(.white.opacity(0.9))
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(filtered) { category in
                            NavigationLink(value: category) {
                                NativeTopicTile(category: category, level: game.topicProgress.first { $0.key == category.key }?.level)
                            }.buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 24)
            .frame(maxWidth: 600).frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear { activateSearch() }
        .onChange(of: focusSearch) { _ in activateSearch() }
        .refreshable { game.loadCategories() }
    }

    private var familyGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(NativeCatalog.families) { item in
                let count = game.categories.filter { NativeCatalog.entry(for: $0.key)?.family == item.id }.count
                Button {
                    family = item.id
                    searchFocused = false
                } label: {
                    VStack(alignment: .leading, spacing: 9) {
                        Image(systemName: item.symbol).font(.system(size: 22))
                            .foregroundColor(Theme.brand)
                            .frame(width: 40, height: 40)
                            .background(Theme.brand.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                        Text(item.title(lang: game.lang))
                            .font(.system(size: 16, weight: .bold)).foregroundColor(Theme.ink)
                        Text("\(count) \(fr ? "thèmes" : "themes")")
                            .font(.system(size: 12)).foregroundColor(Theme.muted)
                    }
                    .padding(14).frame(maxWidth: .infinity, minHeight: 128, alignment: .leading)
                    .background(Theme.paper, in: RoundedRectangle(cornerRadius: 20))
                }.buttonStyle(.plain)
            }
        }
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
        }.foregroundColor(.white).padding(.vertical, 16)
    }
}

struct NativeTopicDetail: View {
    @EnvironmentObject var game: GameSocket
    let category: Category
    @State private var showPlay = false
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text(NativeCatalog.familyTitle(for: category, lang: game.lang).uppercased())
                    .font(.system(size: 12, weight: .bold)).tracking(1.5)
                    .foregroundColor(.white.opacity(0.9))
                Text(NativeCatalog.title(for: category, lang: game.lang))
                    .font(.system(size: 32, weight: .bold)).tracking(-0.7)
                    .multilineTextAlignment(.center).foregroundColor(.white)
                    .accessibilityAddTraits(.isHeader)
                NativeTopicArt(category: category)
                    .frame(maxWidth: 320).clipShape(RoundedRectangle(cornerRadius: 20))
                if fr, let description = NativeCatalog.entry(for: category.key)?.description, !description.isEmpty {
                    Text(description).font(.system(size: 16)).multilineTextAlignment(.center)
                        .foregroundColor(.white.opacity(0.95))
                }
                HStack(spacing: 24) {
                    VStack(spacing: 5) {
                        Text("\(category.count)").font(.system(size: 25, weight: .bold))
                        Text(fr ? "questions" : "questions").font(.system(size: 13))
                    }
                    if let progress = game.topicProgress.first(where: { $0.key == category.key }) {
                        VStack(spacing: 5) {
                            Text("\(progress.level)").font(.system(size: 25, weight: .bold))
                            Text(fr ? "niveau" : "level").font(.system(size: 13))
                        }
                    }
                }.foregroundColor(.white).padding(.vertical, 8)
                Button { showPlay = true } label: {
                    Label(fr ? "Jouer" : "Play", systemImage: "bolt.fill")
                        .font(.system(size: 18, weight: .bold))
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .foregroundColor(Theme.ink)
                        .background(Theme.gold, in: RoundedRectangle(cornerRadius: 18))
                }.disabled(game.isStarting)
            }
            .padding(24).frame(maxWidth: 550).frame(maxWidth: .infinity)
        }
        .background(Theme.brand.ignoresSafeArea())
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(Theme.brand, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPlay) { NativePlaySheet(category: category) }
    }
}

struct NativePlaySheet: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    let category: Category?
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Text(category.map { NativeCatalog.title(for: $0, lang: game.lang) } ?? (fr ? "À vous de jouer" : "Let's play"))
                    .font(.system(size: 28, weight: .bold)).tracking(-0.6)
                Text(fr ? "Choisissez votre façon de jouer." : "Choose how you want to play.")
                    .font(.system(size: 15)).foregroundColor(Theme.muted)
                modeButton(solo: false, symbol: "person.2", title: fr ? "Duel rapide" : "Quick duel", subtitle: fr ? "Affrontez d’autres joueurs" : "Challenge other players")
                modeButton(solo: true, symbol: "person", title: fr ? "En solo" : "Solo", subtitle: fr ? "Entraînez-vous à votre rythme" : "Practice on your own")
                Spacer(minLength: 0)
            }
            .foregroundColor(Theme.ink).padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Theme.paper.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(fr ? "Fermer" : "Close") { dismiss() }.foregroundColor(Theme.brand)
                }
            }
        }
        .presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
    }
    private func modeButton(solo: Bool, symbol: String, title: String, subtitle: String) -> some View {
        Button {
            guard !game.isStarting else { return }
            game.soloMode = solo
            dismiss()
            if let category { game.startWithCategory(category.key) } else { game.quickMatch() }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: symbol).font(.system(size: 24)).frame(width: 36)
                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.system(size: 18, weight: .bold))
                    Text(subtitle).font(.system(size: 13))
                }
                Spacer(minLength: 0)
                Image(systemName: "arrow.right")
            }
            .foregroundColor(solo ? Theme.ink : .white).padding(18)
            .frame(maxWidth: .infinity, minHeight: 80, alignment: .leading)
            .background(solo ? Theme.gold : Theme.brand, in: RoundedRectangle(cornerRadius: 18))
        }.buttonStyle(.plain).disabled(game.isStarting)
    }
}
