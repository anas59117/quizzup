import SwiftUI

struct WaitingView: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    Text("QUIZZUP · DUEL").font(.caption2.weight(.bold)).tracking(2.5).foregroundColor(Theme.gold)
                    Text(game.t("searchingOpponent"))
                        .font(.title.weight(.bold)).multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                    ZStack {
                        NativeSearchWorld()
                            .fill(Color(hex: 0x3B4848))
                            .overlay(NativeSearchWorld().stroke(Color(hex: 0x788783).opacity(0.5), lineWidth: 0.6))
                            .accessibilityHidden(true)
                        ForEach(0..<3) { index in
                            Circle().stroke(Theme.gold.opacity(0.19 - Double(index) * 0.04), lineWidth: 1)
                                .frame(width: CGFloat(130 + index * 70), height: CGFloat(130 + index * 70))
                                .scaleEffect(pulse ? 1.13 : 0.9)
                                .accessibilityHidden(true)
                        }
                        VStack(spacing: 12) {
                            NativePlayerPortrait(avatar: game.avatar, size: 84)
                                .padding(6).background(Theme.canvas, in: Circle())
                                .overlay(Circle().stroke(Theme.gold.opacity(0.75), lineWidth: 1))
                            Text(game.name).font(.title3.weight(.bold))
                                .padding(.horizontal, 12).padding(.vertical, 5)
                                .background(Theme.canvas.opacity(0.92), in: Capsule())
                        }
                    }
                    .frame(maxWidth: .infinity).frame(height: 300)
                    HStack(spacing: 9) {
                        Circle().fill(Theme.gold).frame(width: 6, height: 6)
                        Text(game.t("searching")).font(.subheadline)
                    }.foregroundColor(NativeDuelColors.secondary)
                    Text(game.lang == "fr" ? "Le prochain duel commence ici." : "Your next duel starts here.")
                        .font(.subheadline).foregroundColor(NativeDuelColors.secondary).multilineTextAlignment(.center)
                    Button(game.cancelPending ? (game.lang == "fr" ? "Annulation…" : "Cancelling…") : game.t("cancel")) {
                        game.cancelQueue()
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .disabled(game.cancelPending)
                    .padding(.horizontal, 40)
                }
                .padding(.horizontal, 24).padding(.vertical, 38)
            }
        }
        .foregroundColor(Theme.paper)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) { pulse = true }
        }
        .onChange(of: reduceMotion) { reduced in if reduced { pulse = false } }
    }
}
