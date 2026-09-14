import SwiftUI

struct RoundIntroView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        VStack(spacing: 12) {
            Spacer()
            if let intro = game.roundIntro {
                Text(intro.icon).font(.system(size: 64))
                    .scaleEffect(intro.isBonus ? 1.2 : 1)
                Text(intro.category).font(.title.bold())
                Text(intro.isBonus ? game.t("bonusRound") : game.t("round", ["n": "\(intro.round)"]))
                    .font(.headline)
                    .foregroundColor(intro.isBonus ? Theme.gold : Theme.textDim)
                Text(intro.isBonus ? game.t("doublePoints") : game.t("roundOf", ["n": "\(intro.round)", "total": "\(intro.totalRounds)"]))
                    .font(.subheadline)
                    .foregroundColor(Theme.textDim)
            }
            Spacer()
        }
    }
}
