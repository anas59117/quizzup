import SwiftUI

// The website result palette: cream typography, red actions, gold rewards.
struct ResultView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()
            if let result = game.result {
                ScrollView {
                    VStack(spacing: 20) {
                        NativeBrandLogo().frame(maxWidth: 130)
                        Image(systemName: result.won ? "trophy.fill" : result.tie ? "equal.circle.fill" : "flag.checkered")
                            .font(.system(size: 58)).foregroundColor(Theme.gold).accessibilityHidden(true)
                        Text(title(result))
                            .font(.largeTitle.weight(.heavy)).foregroundColor(Theme.paper)
                            .multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                        Text(left(result) ? game.t("someoneLeft") : game.t("finalScore", ["n": "\(result.finalScore)"]))
                            .font(.subheadline).foregroundColor(Theme.muted)
                        resultPlayers(result)
                        rewards(result)
                        VStack(spacing: 10) {
                            Button(game.rematchWaiting ? (game.lang == "fr" ? "Revanche proposée…" : "Rematch requested…") : game.t("rematch")) { game.requestRematch() }
                                .buttonStyle(NativeDuelActionStyle())
                                .disabled(game.rematchWaiting)
                            Button(game.opponents.isEmpty ? game.t("newGame") : game.t("newOpponent")) {
                                game.quickMatch()
                            }.buttonStyle(NativeDuelActionStyle(prominent: false))
                                .disabled(game.isStarting)
                            Button(game.t("backHome")) { game.playAgain() }
                                .font(.subheadline.weight(.semibold)).foregroundColor(Theme.muted)
                                .frame(maxWidth: .infinity, minHeight: 44)
                        }
                    }
                    .padding(.horizontal, 24).padding(.vertical, 28)
                }
            }
        }.foregroundColor(Theme.paper)
    }

    private func left(_ result: GameEnd) -> Bool {
        result.reason == "opponent_disconnected" || result.reason == "opponent_left"
    }
    private func title(_ result: GameEnd) -> String {
        if game.opponents.isEmpty && !left(result) { return game.t("finished") }
        return game.t(result.won ? "victory" : result.tie ? "draw" : "defeat")
    }

    private func resultPlayers(_ result: GameEnd) -> some View {
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
                              score: player.score, targetId: player.clientId ?? player.id)
                }
            }
        }
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 14))
    }

    private func resultRow(rank: Int, id: String, name: String, avatar: String, score: Int, targetId: String) -> some View {
        HStack(spacing: 10) {
            Text(String(format: "%02d", rank)).font(.caption.weight(.bold)).foregroundColor(Theme.ink.opacity(0.6))
            NativePlayerPortrait(avatar: avatar, size: 44)
            VStack(alignment: .leading, spacing: 3) {
                Text(name).font(.headline).foregroundColor(Theme.ink)
                if id == game.myId {
                    Text(game.lang == "fr" ? "TOI" : "YOU").font(.caption2.weight(.bold)).foregroundColor(Theme.brand)
                }
            }
            Spacer(minLength: 0)
            Text("\(score)").font(.title2.weight(.heavy)).monospacedDigit().foregroundColor(Theme.ink)
            if id != game.myId {
                ReportBlockButton(targetId: targetId, targetName: name)
                    .frame(minWidth: 44, minHeight: 44).tint(Theme.ink)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 12)
    }

    private func moderationId(_ id: String, result: GameEnd) -> String {
        result.others.first(where: { $0.id == id })?.clientId
            ?? game.opponents.first(where: { $0.id == id })?.clientId ?? id
    }

    private func rewards(_ result: GameEnd) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 14) {
                if let stats = result.stats {
                    LevelRing(level: stats.level, xpIntoLevel: stats.xpIntoLevel, xpForLevel: stats.xpForLevel)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("+\(result.xp) XP").font(.title2.weight(.heavy)).foregroundColor(Theme.gold)
                    Text(game.t("coins", ["n": "\(result.coins)"])).font(.subheadline).foregroundColor(Theme.paper)
                }
                Spacer(minLength: 0)
            }
            Divider().overlay(Theme.paper.opacity(0.1))
            xpRow(game.t("matchScore"), "\(result.xpBreakdown.matchScore)")
            xpRow(game.t("finishBonus"), "+\(result.xpBreakdown.finishBonus)")
            xpRow(game.t("winBonus"), "+\(result.xpBreakdown.winBonus)")
            xpRow(game.t("xpTotal"), "\(result.xp)", bold: true)
        }
        .padding(18)
        .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.gold.opacity(0.25), lineWidth: 1))
    }

    private func xpRow(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack {
            Text(label).foregroundColor(bold ? Theme.paper : Theme.muted)
            Spacer()
            Text(value).fontWeight(bold ? .bold : .regular).foregroundColor(bold ? Theme.gold : Theme.paper)
        }.font(.subheadline)
    }
}

struct LevelRing: View {
    let level: Int
    let xpIntoLevel: Int
    let xpForLevel: Int

    private var progress: Double { min(1, max(0, xpForLevel > 0 ? Double(xpIntoLevel) / Double(xpForLevel) : 0)) }
    var body: some View {
        ZStack {
            Circle().stroke(Theme.paper.opacity(0.15), lineWidth: 5)
            Circle().trim(from: 0, to: progress)
                .stroke(Theme.gold, style: StrokeStyle(lineWidth: 5, lineCap: .round)).rotationEffect(.degrees(-90))
            Text("\(level)").font(.title2.bold()).foregroundColor(Theme.paper)
        }
        .frame(width: 60, height: 60)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Level \(level)")
        .accessibilityValue("\(xpIntoLevel) / \(xpForLevel) XP")
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.headline).foregroundColor(Theme.paper)
            .frame(maxWidth: .infinity, minHeight: 24).padding()
            .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 11))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}
