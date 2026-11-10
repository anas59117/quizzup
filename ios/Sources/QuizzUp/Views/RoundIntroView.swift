import SwiftUI

struct RoundIntroView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        GeometryReader { geometry in
            let screenHeight = geometry.size.height + geometry.safeAreaInsets.top + geometry.safeAreaInsets.bottom
            ScrollView {
                Group {
                    if let intro = game.roundIntro {
                        if intro.round == 1, game.opponents.count == 1, let opponent = game.opponents.first {
                            faceoff(intro, opponent: opponent, screenHeight: screenHeight)
                        } else {
                            roundTitle(intro)
                        }
                    }
                }
                .multilineTextAlignment(.center)
                .padding(.horizontal, 12).padding(.vertical, 30)
                .frame(maxWidth: 520)
                .frame(minHeight: geometry.size.height)
                .frame(maxWidth: .infinity)
            }
        }
        .background(NativeDuelColors.introCanvas.ignoresSafeArea())
        .foregroundColor(NativeDuelColors.atlasPaper)
    }

    private func roundTitle(_ intro: RoundIntro) -> some View {
        VStack(spacing: 8) {
            Text(intro.icon.isEmpty ? "🏆" : intro.icon).font(.system(size: 48)).accessibilityHidden(true)
            Text(intro.category.uppercased())
                .font(.caption.weight(.bold)).tracking(1.8).foregroundColor(NativeDuelColors.secondary)
            Text(intro.isBonus ? game.t("bonusRound") : game.t("round", ["n": "\(intro.round)"]))
                .font(.largeTitle.weight(.heavy)).accessibilityAddTraits(.isHeader)
            Text(intro.isBonus ? game.t("doublePoints") : roundCount(intro))
                .font(.subheadline).foregroundColor(NativeDuelColors.secondary)
        }
    }

    private func faceoff(_ intro: RoundIntro, opponent: Opponent, screenHeight: CGFloat) -> some View {
        let portraitSize: CGFloat = screenHeight >= 800 ? 115 : screenHeight <= 680 ? 72 : 94
        let panelHeight: CGFloat = screenHeight >= 800 ? 245 : screenHeight <= 680 ? 175 : 208
        let you = game.lang == "fr" ? "Toi" : "You"
        let level = game.lang == "fr" ? "Niveau" : "Level"
        let opponentLabel = game.lang == "fr" ? "Adversaire" : "Opponent"

        return VStack(spacing: 18) {
            VStack(spacing: 8) {
                Text("QUIZZUP · DUEL")
                    .font(.caption2.weight(.heavy)).tracking(2.2).foregroundColor(NativeDuelColors.atlasGold)
                Text(intro.category).font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
            }
            VStack(spacing: 0) {
                faceoffPlayer(avatar: game.avatar, name: game.name, caption: you,
                              subtitle: "\(level) \(game.stats?.level ?? 1)", mine: true,
                              portraitSize: portraitSize, panelHeight: panelHeight)
                    .overlay(alignment: .bottom) { faceoffDivider }
                    .zIndex(1)
                faceoffPlayer(avatar: opponent.avatar, name: opponent.name, caption: opponentLabel,
                              subtitle: opponentLabel, mine: false, portraitSize: portraitSize, panelHeight: panelHeight)
                    .overlay(alignment: .topTrailing) {
                        ReportBlockButton(targetId: opponent.clientId ?? opponent.id, targetName: opponent.name,
                                          foreground: Color(hex: 0xB5B9BC))
                            .padding(.top, 12).padding(.trailing, 4)
                    }
            }
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color(hex: 0x383A3B)))
            Text("\(game.t("round", ["n": "1"])) · \(roundCount(intro))")
                .font(.caption).foregroundColor(Color(hex: 0x9EA7AE))
        }
    }

    private var faceoffDivider: some View {
        Rectangle()
            .fill(LinearGradient(colors: [NativeDuelColors.atlasGold.opacity(0.1),
                                          NativeDuelColors.atlasGold.opacity(0.6),
                                          NativeDuelColors.atlasGold.opacity(0.1)],
                                 startPoint: .leading, endPoint: .trailing))
            .frame(height: 1)
            .overlay {
                Image(systemName: "bolt.fill").font(.system(size: 23, weight: .semibold))
                    .foregroundColor(Color(hex: 0x282414))
                    .frame(width: 45, height: 45)
                    .background(NativeDuelColors.atlasGold, in: Circle())
                    .padding(6).background(Color(hex: 0x171A1B), in: Circle())
            }
            .overlay(alignment: .trailing) {
                Text("VS").font(.system(size: 9, weight: .bold)).tracking(1.35)
                    .foregroundColor(Color(hex: 0xD1C9AD))
                    .padding(.horizontal, 7).padding(.vertical, 4)
                    .background(Color(hex: 0x181C1E))
                    .padding(.trailing, 17)
            }
            .accessibilityHidden(true).allowsHitTesting(false)
    }

    private func faceoffPlayer(avatar: String, name: String, caption: String, subtitle: String, mine: Bool,
                               portraitSize: CGFloat, panelHeight: CGFloat) -> some View {
        VStack(spacing: 5) {
            NativePlayerPortrait(avatar: avatar, size: portraitSize)
                .padding(5).background(Color(hex: 0x101419), in: Circle())
                .overlay(Circle().strokeBorder(mine ? NativeDuelColors.atlasGold.opacity(0.5) : Color(hex: 0x64717A)))
                .shadow(color: .black.opacity(0.33), radius: 15, y: 6)
                .padding(.bottom, 5)
            Text(name).font(.title2.weight(.bold)).fixedSize(horizontal: false, vertical: true)
            Text(subtitle).font(.caption).foregroundColor(Color(hex: 0xADB5BB))
        }
        .padding(.horizontal, 20).padding(.top, mine ? 25 : 31).padding(.bottom, mine ? 31 : 25)
        .frame(maxWidth: .infinity, minHeight: panelHeight)
        .background {
            RadialGradient(colors: [mine ? NativeDuelColors.atlasGold.opacity(0.07) : Color(hex: 0xB7C4D0).opacity(0.05), .clear],
                           center: mine ? .init(x: 0.5, y: 0.35) : .center, startRadius: 0, endRadius: 180)
                .background(mine ? Color(hex: 0x1E2020) : Color(hex: 0x12171B))
        }
        .overlay(alignment: .topLeading) {
            Text(caption.uppercased()).font(.system(size: 9, weight: .bold)).tracking(1.15)
                .foregroundColor(mine ? NativeDuelColors.atlasGold : Color(hex: 0xB5B9BC))
                .padding(.leading, 17).padding(.top, 15)
        }
        .accessibilityElement(children: .combine)
    }

    private func roundCount(_ intro: RoundIntro) -> String {
        game.t("roundOf", ["n": "\(intro.round)", "total": "\(intro.totalRounds)"])
    }
}
