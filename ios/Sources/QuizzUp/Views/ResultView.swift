import SwiftUI

struct ResultView: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dynamicTypeSize) private var dynamicType
    @ScaledMetric(relativeTo: .largeTitle) private var headlineSize: CGFloat = 38
    @ScaledMetric(relativeTo: .title) private var scoreSize: CGFloat = 38
    @State private var showDetails = false

    private let gold = Color(hex: 0xFFD54A)
    private let pale = Color(hex: 0xFFE5E9)

    var body: some View {
        ScrollView {
            if let result = game.result {
                VStack(alignment: .leading, spacing: 0) {
                    heading(result)
                    scoreboard(result).padding(.top, 20)
                    rewardStrip(result).padding(.top, 10)
                    actions(result).padding(.top, 20)
                    if let stats = result.stats {
                        levelProgress(stats).padding(.top, 22)
                    }
                    Button {
                        showDetails.toggle()
                    } label: {
                        Text(showDetails ? copy("Masquer le détail", "Hide details") : copy("Voir le détail", "Show details"))
                            .underline()
                    }
                    .buttonStyle(ResultDetailsButtonStyle())
                    .accessibilityValue(showDetails ? copy("Développé", "Expanded") : copy("Réduit", "Collapsed"))
                    .padding(.top, 12)
                    if showDetails { breakdown(result).padding(.top, 10) }
                }
                .padding(.horizontal, 16).padding(.top, 24).padding(.bottom, 40)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
        }
        .foregroundColor(.white)
        .background {
            LinearGradient(colors: [Color(hex: 0xC81E3A), Color(hex: 0xB51B33)], startPoint: .top, endPoint: .bottom)
                .overlay {
                    RadialGradient(colors: [.white.opacity(0.12), .clear], center: .top,
                                   startRadius: 0, endRadius: 480)
                }
                .ignoresSafeArea()
        }
    }

    private func heading(_ result: GameEnd) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if playerCount(result) == 2, let opponent = opponent(result) {
                let separator = game.lang == "fr" ? "à" : "to"
                Text("\(result.finalScore) \(separator) \(opponent.score)")
                    .font(.subheadline).monospacedDigit().foregroundColor(pale)
            }
            (Text(title(result)) + Text(".").foregroundColor(gold))
                .font(.system(size: headlineSize, weight: .black, design: .serif).italic())
                .tracking(-1).fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            if left(result) { Text(game.t("someoneLeft")).font(.subheadline).foregroundColor(pale) }
        }
    }

    private func left(_ result: GameEnd) -> Bool {
        result.reason == "opponent_disconnected" || result.reason == "opponent_left"
    }

    private func playerCount(_ result: GameEnd) -> Int {
        max(result.leaderboard.count, max(game.opponents.count, result.others.count) + 1)
    }

    private func opponent(_ result: GameEnd) -> OpponentFinal? {
        if let player = result.others.first { return player }
        if let player = result.leaderboard.first(where: { $0.id != game.myId }) {
            return OpponentFinal(id: player.id, name: player.name, avatar: player.avatar, score: player.score)
        }
        return game.opponents.first.map {
            OpponentFinal(id: $0.id, name: $0.name, avatar: $0.avatar, score: $0.score, clientId: $0.clientId)
        }
    }

    private func title(_ result: GameEnd) -> String {
        if playerCount(result) == 1 && !left(result) { return copy("Partie terminée", "Game complete") }
        if result.won { return copy("Belle victoire", "Great victory") }
        if result.tie { return copy("Match nul", "A draw") }
        return copy("Pas cette fois", "Next time")
    }

    @ViewBuilder private func scoreboard(_ result: GameEnd) -> some View {
        if playerCount(result) > 2 {
            ranking(result)
        } else if let player = opponent(result), playerCount(result) == 2 {
            HStack(alignment: .center, spacing: 12) {
                scorePlayer(avatar: game.avatar, name: copy("Toi", "You"), score: result.finalScore,
                            mine: true, highlighted: result.won || result.tie)
                Text("vs").font(.subheadline.weight(.bold)).foregroundColor(.white.opacity(0.65))
                    .accessibilityHidden(true)
                scorePlayer(avatar: player.avatar, name: player.name, score: player.score,
                            mine: false, highlighted: !result.won && !result.tie)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(Color.black.opacity(0.32), in: RoundedRectangle(cornerRadius: 22))
            .overlay(alignment: .topTrailing) {
                ReportBlockButton(targetId: moderationId(player.id, result: result), targetName: player.name, foreground: pale)
            }
        } else {
            VStack(spacing: 4) {
                Text("\(result.finalScore)").font(.system(size: scoreSize * 1.6, weight: .bold))
                    .monospacedDigit().foregroundColor(gold)
                Text(game.t("matchScore")).font(.caption).foregroundColor(pale)
            }
            .frame(maxWidth: .infinity).padding(20)
            .background(Color.black.opacity(0.32), in: RoundedRectangle(cornerRadius: 22))
            .accessibilityElement(children: .combine)
        }
    }

    private func scorePlayer(avatar: String, name: String, score: Int, mine: Bool, highlighted: Bool) -> some View {
        VStack(spacing: 2) {
            NativePlayerPortrait(avatar: avatar, size: 44)
                .background {
                    LinearGradient(colors: mine ? [Color(hex: 0xFFB199), Color(hex: 0xE63246)]
                                   : [Color(hex: 0xAAD3FF), Color(hex: 0x3E6FB8)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                        .clipShape(Circle())
                }
                .overlay(Circle().strokeBorder(Color.white.opacity(0.30), lineWidth: 2))
            Text("\(score)").font(.system(size: scoreSize, weight: .bold))
                .monospacedDigit().foregroundColor(highlighted ? gold : .white)
            Text(name).font(.caption.weight(.medium)).foregroundColor(pale)
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    private func ranking(_ result: GameEnd) -> some View {
        VStack(spacing: 0) {
            if !result.leaderboard.isEmpty {
                ForEach(Array(result.leaderboard.enumerated()), id: \.element.id) { index, player in
                    resultRow(rank: index + 1, id: player.id, name: player.name, avatar: player.avatar,
                              score: player.score, targetId: moderationId(player.id, result: result))
                }
            } else {
                resultRow(rank: 1, id: game.myId ?? "", name: game.name, avatar: game.avatar,
                          score: result.finalScore, targetId: game.myId ?? "")
                ForEach(Array(result.others.enumerated()), id: \.element.id) { index, player in
                    resultRow(rank: index + 2, id: player.id, name: player.name, avatar: player.avatar,
                              score: player.score, targetId: moderationId(player.id, result: result))
                }
            }
        }
        .background(Color.black.opacity(0.26), in: RoundedRectangle(cornerRadius: 20))
    }

    private func resultRow(rank: Int, id: String, name: String, avatar: String, score: Int, targetId: String) -> some View {
        let mine = id == (game.myId ?? "")
        return HStack(spacing: 10) {
            Text("\(rank)").font(.caption.weight(.bold)).foregroundColor(pale)
            NativePlayerPortrait(avatar: avatar, size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text(name).font(.subheadline.weight(.semibold))
                if mine { Text(copy("Toi", "You")).font(.caption).foregroundColor(pale) }
            }
            Spacer(minLength: 0)
            Text("\(score)").font(.title2.weight(.bold)).monospacedDigit().foregroundColor(mine ? gold : .white)
            if !mine {
                ReportBlockButton(targetId: targetId, targetName: name, foreground: pale)
            }
        }
        .padding(.leading, 12).padding(.trailing, mine ? 12 : 4).padding(.vertical, 5)
    }

    private func moderationId(_ id: String, result: GameEnd) -> String {
        result.others.first(where: { $0.id == id })?.clientId
            ?? game.opponents.first(where: { $0.id == id })?.clientId ?? id
    }

    private func rewardStrip(_ result: GameEnd) -> some View {
        HStack(spacing: 8) {
            reward("+\(result.xp)", label: game.t("xpTotal"))
            if result.coins > 0 { reward("+\(result.coins)", label: copy("Pièces", "Coins")) }
        }
        .padding(8)
        .background(Color.black.opacity(0.125), in: RoundedRectangle(cornerRadius: 16))
    }

    private func reward(_ value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.weight(.bold)).monospacedDigit().foregroundColor(gold)
            Text(label).font(.caption).foregroundColor(pale)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    private func actions(_ result: GameEnd) -> some View {
        let solo = playerCount(result) == 1
        return VStack(spacing: 10) {
            if solo {
                newMatch(title: game.t("newGame"), prominent: true)
                homeButton
            } else {
                Button(game.rematchWaiting ? copy("En attente…", "Waiting…") : game.t("rematch")) { game.requestRematch() }
                    .buttonStyle(NativeDuelActionStyle()).disabled(game.rematchWaiting || game.isStarting)
                if dynamicType.isAccessibilitySize {
                    VStack(spacing: 10) {
                        newMatch(title: game.t("newOpponent"), prominent: false)
                        homeButton
                    }
                } else {
                    HStack(spacing: 10) {
                        newMatch(title: game.t("newOpponent"), prominent: false)
                        homeButton
                    }
                }
            }
        }
    }

    private func newMatch(title: String, prominent: Bool) -> some View {
        Button(title) { game.quickMatch() }
            .buttonStyle(NativeDuelActionStyle(prominent: prominent)).disabled(game.isStarting)
    }

    private var homeButton: some View {
        Button(game.t("backHome")) { game.playAgain() }
            .buttonStyle(NativeDuelActionStyle(prominent: false)).disabled(game.isStarting)
    }

    private func levelProgress(_ stats: PlayerStats) -> some View {
        HStack(spacing: 14) {
            LevelRing(level: stats.level, xpIntoLevel: stats.xpIntoLevel, xpForLevel: stats.xpForLevel, tint: gold)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(copy("Niveau", "Level")) \(stats.level)").font(.subheadline.weight(.bold))
                Text("\(stats.xpIntoLevel) / \(stats.xpForLevel) XP").font(.caption)
                    .monospacedDigit().foregroundColor(pale)
            }
        }
        .accessibilityElement(children: .combine)
    }

    private func breakdown(_ result: GameEnd) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(copy("Statistiques du match", "Match statistics"))
                .font(.headline).accessibilityAddTraits(.isHeader)
            xpRow(game.t("matchScore"), "\(result.xpBreakdown.matchScore)")
            xpRow(game.t("finishBonus"), "+\(result.xpBreakdown.finishBonus)")
            xpRow(game.t("winBonus"), "+\(result.xpBreakdown.winBonus)")
            Divider().overlay(Color.white.opacity(0.2))
            xpRow(game.t("xpTotal"), "\(result.xp)", total: true)
        }
        .padding(16)
        .background(Color.black.opacity(0.22), in: RoundedRectangle(cornerRadius: 16))
    }

    private func xpRow(_ label: String, _ value: String, total: Bool = false) -> some View {
        HStack {
            Text(label).foregroundColor(total ? .white : pale)
            Spacer()
            Text(value).fontWeight(total ? .bold : .regular).foregroundColor(total ? gold : .white)
        }
        .font(.subheadline)
        .accessibilityElement(children: .combine)
    }

    private func copy(_ french: String, _ english: String) -> String { game.lang == "fr" ? french : english }
}

private struct LevelRing: View {
    let level: Int
    let xpIntoLevel: Int
    let xpForLevel: Int
    let tint: Color

    private var progress: Double { min(1, max(0, xpForLevel > 0 ? Double(xpIntoLevel) / Double(xpForLevel) : 0)) }
    var body: some View {
        ZStack {
            Circle().fill(Color(hex: 0x9E182E))
            Circle().strokeBorder(.white.opacity(0.17), lineWidth: 5)
            Circle().inset(by: 2.5).trim(from: 0, to: progress)
                .stroke(tint, lineWidth: 5).rotationEffect(.degrees(-90))
            Text("\(level)").font(.subheadline.weight(.bold)).foregroundColor(.white)
        }
        .frame(width: 46, height: 46)
    }
}

private struct ResultDetailsButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.subheadline)
            .foregroundColor(Color(hex: 0xFFE5E9))
            .frame(maxWidth: .infinity, minHeight: 44).contentShape(Rectangle())
            .opacity(configuration.isPressed ? 0.75 : 1)
    }
}
