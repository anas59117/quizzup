import SwiftUI

struct NativeTopicDetail: View {
    @EnvironmentObject var game: GameSocket
    let category: Category
    let onBack: () -> Void
    let onSettings: () -> Void
    let onChallenge: () -> Void
    let onCommunity: () -> Void
    @State private var showPlay = false
    @State private var showRanking = false
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize = 38.0
    private let ink = Color(hex: 0xFFF8F3)
    private let muted = Color(hex: 0xF1D8DE)
    private let line = Color.white.opacity(0.16)
    private let accent = Color(hex: 0xFFE49C)
    private var fr: Bool { game.lang == "fr" }
    private var entry: NativeCatalogEntry? { NativeCatalog.entry(for: category.key) }
    private var title: String { NativeCatalog.title(for: category, lang: game.lang) }
    private var eyebrow: String {
        entry?.detailEyebrow ?? NativeCatalog.familyTitle(for: category, lang: game.lang)
    }
    private var description: String? {
        (fr ? entry?.detailDescription : entry?.detailEnglishDescription) ?? entry?.description
    }
    private var tint: Color {
        guard let value = entry?.detailTint, let hex = UInt32(value.dropFirst(), radix: 16) else {
            return Color(hex: 0x4B2436)
        }
        return Color(hex: hex)
    }
    private var following: Bool { game.followedThemes.contains(category.key) }
    private var progress: NativeTopicProgress? { game.topicProgress.first { $0.key == category.key } }

    var body: some View {
        GeometryReader { geometry in
            let heroHeight = min(410, max(290, geometry.size.width * 0.97))
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 0) {
                        artwork(height: heroHeight)
                        VStack(alignment: .leading, spacing: 0) {
                            introduction
                            actions.padding(.top, 22)
                            progressRow.padding(.top, 19)
                            invitation.padding(.top, 18)
                            socialLinks.padding(.top, 16).id("topic-social")
                        }
                        .padding(.horizontal, 24).padding(.bottom, 16)
                        .padding(.top, -22)
                    }
                    .frame(maxWidth: 600).frame(maxWidth: .infinity)
                }
                .ignoresSafeArea(edges: .top)
                #if DEBUG && STORE_CAPTURE
                .onAppear {
                    if StoreCaptureConfiguration.options?.screen == "detail-scrolled" {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                            proxy.scrollTo("topic-social", anchor: .bottom)
                        }
                    }
                }
                #endif
            }
        }
        .overlay(alignment: .top) {
            header.padding(.top, 10).padding(.bottom, 10)
                .background(LinearGradient(colors: [tint.opacity(0.95), tint.opacity(0.7), .clear], startPoint: .top, endPoint: .bottom))
        }
        .background(tint.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showPlay) { NativePlaySheet(category: category) }
        .sheet(isPresented: $showRanking) { NativeTopicRankingSheet(category: category) }
    }

    private func artwork(height: CGFloat) -> some View {
        NativeTopicArt(category: category, ratio: nil, detail: true, tint: tint)
            .frame(height: height)
            .overlay {
                LinearGradient(
                    stops: [
                        .init(color: Color(hex: 0x101820).opacity(0.53), location: 0),
                        .init(color: .clear, location: 0.27),
                        .init(color: .clear, location: 0.60),
                        .init(color: tint.opacity(0.72), location: 0.85),
                        .init(color: tint, location: 1)
                    ],
                    startPoint: .top, endPoint: .bottom
                )
                .allowsHitTesting(false)
            }
    }

    private var header: some View {
        HStack(spacing: 8) {
            control("arrow.left", label: fr ? "Retour" : "Back", action: onBack)
            Spacer(minLength: 8)
            control(
                following ? "heart.fill" : "heart",
                label: following ? (fr ? "Ne plus suivre le thème" : "Unfollow topic") : (fr ? "Suivre le thème" : "Follow topic"),
                active: following
            ) {
                game.setThemeFollowing(category.key, following: !following)
            }
            control("gearshape", label: fr ? "Réglages" : "Settings", action: onSettings)
        }
        .padding(.horizontal, 22)
    }

    private func control(_ symbol: String, label: String, active: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 19, weight: .semibold))
                .foregroundColor(active ? Theme.gold : ink)
                .frame(width: 44, height: 44)
                .background(Color(hex: 0x16202C).opacity(0.81), in: Circle())
                .overlay { Circle().strokeBorder(active ? Theme.gold.opacity(0.5) : line).allowsHitTesting(false) }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(active ? .isSelected : [])
    }

    private var introduction: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(eyebrow.uppercased())
                .font(.system(size: 10, weight: .heavy)).tracking(1.5)
                .foregroundColor(accent)
            Text(title)
                .font(.system(size: titleSize, weight: .heavy)).tracking(-1.5)
                .foregroundColor(ink).accessibilityAddTraits(.isHeader)
            if let description, !description.isEmpty {
                Text(description)
                    .font(.subheadline).foregroundColor(muted).lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var actions: some View {
        HStack(spacing: 10) {
            Button { showPlay = true } label: {
                Label(fr ? "Jouer maintenant" : "Play now", systemImage: "bolt")
                    .font(.system(size: 16, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color(hex: 0x34220C))
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .frame(maxWidth: .infinity, minHeight: 56)
                    .background(Color(hex: 0xFFDC52), in: RoundedRectangle(cornerRadius: 16))
            }
            Button(action: onChallenge) {
                Image(systemName: "person.2")
                    .font(.system(size: 22, weight: .medium)).foregroundColor(ink)
                    .frame(width: 56, height: 56)
                    .background(.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 16))
                    .overlay {
                        RoundedRectangle(cornerRadius: 16).strokeBorder(.white.opacity(0.22)).allowsHitTesting(false)
                    }
            }
            .accessibilityLabel(fr ? "Défier un ami" : "Challenge a friend")
        }
        .buttonStyle(.plain)
        .disabled(game.isStarting)
    }

    private var progressRow: some View {
        let level = progress?.level ?? 1
        return HStack(spacing: 0) {
            Label {
                Text("\(fr ? "Niveau" : "Level") \(level)")
                    .font(.system(size: 12, weight: .bold)).foregroundColor(ink)
            } icon: {
                Image(systemName: "trophy").font(.system(size: 14)).foregroundColor(accent)
            }
            Spacer(minLength: 4)
            statistic(fr ? "Progression" : "Progress", progress?.completion.map { "\($0)%" } ?? "—")
            Spacer(minLength: 4)
            statistic(fr ? "Série" : "Streak", progress?.bestStreak.map(String.init) ?? "—")
        }
        .padding(.vertical, 17)
        .overlay(alignment: .bottom) { line.frame(height: 1) }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(fr ? "Ta progression" : "Your progress")
        .accessibilityValue("\(fr ? "Niveau" : "Level") \(level), \(fr ? "Progression" : "Progress") \(progress?.completion.map { "\($0)%" } ?? "—"), \(fr ? "Série" : "Streak") \(progress?.bestStreak.map(String.init) ?? "—")")
    }

    private func statistic(_ label: String, _ value: String) -> some View {
        HStack(spacing: 8) {
            line.frame(width: 1, height: 13).padding(.trailing, 3)
            Text(label).foregroundColor(muted)
            Text(value).fontWeight(.bold).foregroundColor(ink)
        }
        .font(.system(size: 12)).lineLimit(1).minimumScaleFactor(0.78)
    }

    private var invitation: some View {
        Button(action: onChallenge) {
            HStack(spacing: 12) {
                Image(systemName: "person.2")
                    .font(.system(size: 19)).foregroundColor(accent)
                    .frame(width: 39, height: 39)
                    .overlay { Circle().strokeBorder(line).allowsHitTesting(false) }
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(fr ? "Défie tes amis" : "Challenge your friends")
                        .font(.system(size: 15, weight: .bold)).foregroundColor(ink)
                    Text(fr ? "Invite un ami à jouer sur ce thème." : "Invite a friend to play this topic.")
                        .font(.system(size: 12)).foregroundColor(muted)
                }
                Spacer(minLength: 0)
            }
            .multilineTextAlignment(.leading)
            .frame(minHeight: 44).contentShape(Rectangle())
        }
        .buttonStyle(.plain).disabled(game.isStarting)
    }

    private var socialLinks: some View {
        HStack(spacing: 10) {
            socialLink(fr ? "Communauté" : "Community", symbol: "bubble.left", action: onCommunity)
            socialLink(fr ? "Classement" : "Leaderboard", symbol: "trophy") { showRanking = true }
        }
        .buttonStyle(.plain)
    }

    private func socialLink(_ title: String, symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.system(size: 12)).foregroundColor(ink)
                .multilineTextAlignment(.center).padding(.horizontal, 6)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background {
                    RoundedRectangle(cornerRadius: 12).strokeBorder(line)
                }
                .contentShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

private struct NativeTopicRankingSheet: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    let category: Category
    @State private var retry = 0
    @State private var timedOut = false
    private var fr: Bool { game.lang == "fr" }
    private var entries: [NativeTopicRankingEntry]? { game.topicLeaderboards[category.key] }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text(fr ? "Classement du thème" : "Topic leaderboard")
                        .font(.system(size: 12, weight: .heavy)).tracking(1.2).textCase(.uppercase)
                        .foregroundColor(Theme.accent)
                    Spacer(minLength: 0)
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").font(.system(size: 15, weight: .semibold))
                            .frame(width: 44, height: 44)
                    }
                    .buttonStyle(.plain).accessibilityLabel(fr ? "Fermer" : "Close")
                }
                Text(NativeCatalog.title(for: category, lang: game.lang))
                    .font(.system(size: 28, weight: .heavy)).accessibilityAddTraits(.isHeader)
                if let entries {
                    if entries.isEmpty {
                        Text(fr ? "Aucun score pour ce thème." : "No scores for this topic.")
                            .font(.subheadline).foregroundColor(Theme.muted)
                    }
                    ForEach(entries, id: \.id) { player in
                        HStack(spacing: 12) {
                            Text("#\(player.rank)").font(.subheadline.bold()).monospacedDigit()
                                .foregroundColor(Theme.accent).frame(minWidth: 29, alignment: .leading)
                            NativePlayerPortrait(avatar: player.avatar, size: 36)
                            Text(player.name).font(.subheadline.bold())
                            Spacer(minLength: 4)
                            Text("\(player.score) XP").font(.subheadline).monospacedDigit()
                        }
                        .padding(12)
                        .background(Theme.ink.opacity(0.045), in: RoundedRectangle(cornerRadius: 14))
                    }
                } else if timedOut {
                    Text(fr ? "Impossible de charger le classement." : "The leaderboard could not load.")
                        .foregroundColor(Theme.muted)
                    Button(fr ? "Réessayer" : "Try again") { retry += 1 }
                        .foregroundColor(Theme.accent).frame(minHeight: 44)
                } else {
                    ProgressView(fr ? "Chargement du classement…" : "Loading the leaderboard…")
                        .tint(Theme.accent)
                }
            }
            .padding(24).frame(maxWidth: 550).frame(maxWidth: .infinity, alignment: .top)
        }
        .foregroundColor(Theme.ink).background(Theme.contentBackground.ignoresSafeArea())

        .presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
        .task(id: retry) {
            timedOut = false
            game.requestTopicLeaderboard(category.key)
            do { try await Task.sleep(nanoseconds: 5_000_000_000) }
            catch { return }
            timedOut = entries == nil
        }
    }
}
