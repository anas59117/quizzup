import SwiftUI

struct ResultView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        guard let result = game.result else { return AnyView(EmptyView()) }
        let isSolo = game.opponents.isEmpty && result.reason != "opponent_disconnected" && result.reason != "opponent_left"
        let left = result.reason == "opponent_disconnected" || result.reason == "opponent_left"

        return AnyView(
            ScrollView {
                VStack(spacing: 16) {
                    Text(titleText(isSolo: isSolo, won: result.won, tie: result.tie))
                        .font(.system(size: 30, weight: .heavy))
                        .foregroundColor(titleColor(isSolo: isSolo, won: result.won, tie: result.tie))

                    Text(left ? "Someone left" : "Final score: \(result.finalScore)")
                        .foregroundColor(Theme.textDim)

                    if let stats = result.stats {
                        LevelRing(level: stats.level, xpIntoLevel: stats.xpIntoLevel, xpForLevel: stats.xpForLevel)
                    }

                    VStack(spacing: 6) {
                        xpRow("Score du match", "\(result.xpBreakdown.matchScore)")
                        xpRow("Bonus fin", "+\(result.xpBreakdown.finishBonus)")
                        xpRow("Bonus victoire", "+\(result.xpBreakdown.winBonus)")
                        xpRow("XP totale", "\(result.xp)", bold: true)
                    }
                    .padding()
                    .background(Theme.surface)
                    .cornerRadius(14)

                    if !result.leaderboard.isEmpty {
                        VStack(spacing: 6) {
                            ForEach(result.leaderboard) { row in
                                HStack {
                                    Text(row.avatar)
                                    Text(row.name)
                                    Spacer()
                                    Text("\(row.score)").bold()
                                }
                                .padding(10)
                                .background(row.id == game.myId ? Theme.accent.opacity(0.15) : Theme.surface)
                                .cornerRadius(10)
                            }
                        }
                    }

                    Text("+\(result.coins) coins").font(.headline).foregroundColor(Theme.gold)

                    VStack(spacing: 10) {
                        Button("Rematch") {
                            game.playAgain()
                            game.quickMatch()
                        }.buttonStyle(PrimaryButtonStyle())

                        Button(isSolo ? "New game" : "New opponent") { game.playAgain() }
                            .buttonStyle(SecondaryButtonStyle())

                        Button("Back to home") { game.playAgain() }
                            .buttonStyle(SecondaryButtonStyle())
                    }
                }
                .padding(24)
            }
        )
    }

    private func titleText(isSolo: Bool, won: Bool, tie: Bool) -> String {
        isSolo ? "TERMINÉ !" : won ? "VICTORY!" : tie ? "DRAW!" : "DEFEAT"
    }
    private func titleColor(isSolo: Bool, won: Bool, tie: Bool) -> Color {
        isSolo || tie ? Theme.gold : won ? Theme.green : Theme.red
    }

    private func xpRow(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack {
            Text(label).foregroundColor(bold ? Theme.text : Theme.textDim)
            Spacer()
            Text(value).fontWeight(bold ? .bold : .regular)
        }
    }
}

struct LevelRing: View {
    let level: Int
    let xpIntoLevel: Int
    let xpForLevel: Int

    private var pct: Double { xpForLevel > 0 ? Double(xpIntoLevel) / Double(xpForLevel) : 0 }

    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.15), lineWidth: 6)
            Circle().trim(from: 0, to: pct)
                .stroke(Theme.accent, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(level)").font(.title2.bold())
        }
        .frame(width: 64, height: 64)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(Theme.text)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Theme.surface)
            .cornerRadius(12)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}
