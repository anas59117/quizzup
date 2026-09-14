import SwiftUI

struct WaitingView: View {
    @EnvironmentObject var game: GameSocket
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            HStack(spacing: 32) {
                VStack {
                    Text(game.avatar).font(.system(size: 32))
                        .frame(width: 80, height: 80)
                        .background(Theme.accent)
                        .clipShape(Circle())
                    Text(game.name).font(.headline)
                }
                Text("⚡").font(.largeTitle)
                    .frame(width: 64, height: 64)
                    .background(Theme.surface2)
                    .clipShape(Circle())
                VStack {
                    Text("?").font(.system(size: 32))
                        .frame(width: 80, height: 80)
                        .background(Theme.surface)
                        .overlay(Circle().stroke(Theme.border, style: StrokeStyle(lineWidth: 2, dash: [5])))
                        .clipShape(Circle())
                        .opacity(pulse ? 0.4 : 1)
                    Text(game.t("searching")).font(.headline).foregroundColor(Theme.textDim)
                }
            }
            Text(game.t("searchingOpponent")).foregroundColor(Theme.textDim)
            Spacer()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}
