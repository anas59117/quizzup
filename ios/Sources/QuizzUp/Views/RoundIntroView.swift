import SwiftUI

struct RoundIntroView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 20) {
                    Text("QUIZZUP · DUEL").font(.caption2.weight(.bold)).tracking(2.5).foregroundColor(Theme.gold)
                    if let intro = game.roundIntro {
                        if intro.round == 1, let opponent = game.opponents.first {
                            faceoff(intro, opponent: opponent)
                        } else {
                            Image(systemName: "trophy.fill").font(.system(size: 76)).foregroundColor(Theme.gold)
                                .padding(.top, 50).accessibilityHidden(true)
                            Text(intro.category).font(.title2.weight(.semibold))
                            Text(intro.isBonus ? game.t("bonusRound") : game.t("round", ["n": "\(intro.round)"]))
                                .font(.largeTitle.weight(.heavy)).foregroundColor(Theme.paper)
                                .accessibilityAddTraits(.isHeader)
                            Text(intro.isBonus ? game.t("doublePoints") : game.t("roundOf", ["n": "\(intro.round)", "total": "\(intro.totalRounds)"]))
                                .font(.subheadline).foregroundColor(NativeDuelColors.secondary)
                            HStack(spacing: 8) {
                                ForEach(1...max(1, intro.totalRounds), id: \.self) { round in
                                    Capsule().fill(round <= intro.round ? Theme.gold : Theme.paper.opacity(0.15))
                                        .frame(width: 22, height: 4)
                                }
                            }.padding(.top, 12).accessibilityHidden(true)
                        }
                    }
                }
                .frame(maxWidth: .infinity).multilineTextAlignment(.center)
                .padding(.horizontal, 24).padding(.vertical, 30)
            }
        }.foregroundColor(Theme.paper)
    }

    private func faceoff(_ intro: RoundIntro, opponent: Opponent) -> some View {
        VStack(spacing: 20) {
            Text(intro.category).font(.title2.weight(.bold)).accessibilityAddTraits(.isHeader)
            VStack(spacing: 0) {
                faceoffPlayer(avatar: game.avatar, name: game.name,
                              caption: game.lang == "fr" ? "TOI" : "YOU", color: NativeDuelColors.mine)
                HStack {
                    Rectangle().frame(height: 1)
                    Text("VS").font(.title3.weight(.black)).italic().padding(.horizontal, 10)
                    Rectangle().frame(height: 1)
                }.foregroundColor(Theme.gold).padding(.horizontal, 20)
                faceoffPlayer(avatar: opponent.avatar, name: opponent.name,
                              caption: game.lang == "fr" ? "ADVERSAIRE" : "OPPONENT", color: NativeDuelColors.other)
            }
            .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.paper.opacity(0.14), lineWidth: 1))
            HStack {
                Image(systemName: "trophy.fill").foregroundColor(Theme.gold)
                Text(game.t("round", ["n": "1"]))
                Text("·")
                Text(game.t("roundOf", ["n": "1", "total": "\(intro.totalRounds)"]))
            }.font(.caption).foregroundColor(NativeDuelColors.secondary)
            ReportBlockButton(targetId: opponent.clientId ?? opponent.id, targetName: opponent.name)
                .frame(minWidth: 44, minHeight: 44)
        }
    }

    private func faceoffPlayer(avatar: String, name: String, caption: String, color: Color) -> some View {
        VStack(spacing: 10) {
            Text(caption).font(.caption2.weight(.bold)).tracking(1.5).foregroundColor(color)
            NativePlayerPortrait(avatar: avatar, size: 90)
                .padding(5).overlay(Circle().stroke(color.opacity(0.8), lineWidth: 2))
            Text(name).font(.title2.weight(.bold)).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity).padding(.horizontal, 20).padding(.vertical, 24)
        .accessibilityElement(children: .combine)
    }
}
