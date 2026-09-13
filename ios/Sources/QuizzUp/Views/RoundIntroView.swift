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
                Text(intro.isBonus ? "BONUS ROUND" : "Round \(intro.round)")
                    .font(.headline)
                    .foregroundColor(intro.isBonus ? Theme.gold : Theme.textDim)
                Text(intro.isBonus ? "Double points!" : "\(intro.round) sur \(intro.totalRounds)")
                    .font(.subheadline)
                    .foregroundColor(Theme.textDim)
            }
            Spacer()
        }
    }
}
