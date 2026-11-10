import SwiftUI

struct WaitingView: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var startedAt = Date()
    @State private var pulse = false

    var body: some View {
        GeometryReader { geometry in
            let screenHeight = geometry.size.height + geometry.safeAreaInsets.top + geometry.safeAreaInsets.bottom
            ScrollView {
                VStack(spacing: 0) {
                    Text("QUIZZUP · DUEL")
                        .font(.caption2.weight(.heavy)).tracking(2.2).foregroundColor(NativeDuelColors.atlasGold)
                    Text(heading)
                        .font(.title2.weight(.semibold)).multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                        .padding(.top, 10).padding(.horizontal, 12)

                    atlas.frame(height: min(370, max(190, screenHeight * 0.43)))

                    HStack(spacing: 8) {
                        Circle().fill(NativeDuelColors.atlasGold).frame(width: 5, height: 5)
                            .accessibilityHidden(true)
                        Text(game.t("searching"))
                        Rectangle().fill(Color(hex: 0x3B4248)).frame(width: 1, height: 14)
                            .accessibilityHidden(true)
                        TimelineView(.periodic(from: startedAt, by: 1)) { context in
                            let seconds = max(0, Int(context.date.timeIntervalSince(startedAt)))
                            Text("\(seconds) s").monospacedDigit().foregroundColor(NativeDuelColors.atlasGold)
                        }
                    }
                    .font(.caption).foregroundColor(Color(hex: 0xBAC1C6))

                    Button { game.cancelQueue() } label: {
                        Text(game.cancelPending ? heading : game.t("cancel"))
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(Color(hex: 0xC1C6CB))
                            .padding(.horizontal, 22).frame(minHeight: 44)
                            .background(Color(hex: 0x14181B), in: RoundedRectangle(cornerRadius: 9))
                            .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(Color(hex: 0x343A3F)))
                            .contentShape(RoundedRectangle(cornerRadius: 9))
                    }
                    .buttonStyle(.plain).disabled(game.cancelPending)
                    .opacity(game.cancelPending ? 0.45 : 1)
                    .padding(.top, 12)
                }
                .padding(.vertical, 28)
                .frame(maxWidth: 520)
                .frame(minHeight: geometry.size.height)
                .frame(maxWidth: .infinity)
            }
        }
        .background(NativeDuelColors.introCanvas.ignoresSafeArea())
        .foregroundColor(NativeDuelColors.atlasPaper)
        .onAppear { updatePulse() }
        .onChange(of: reduceMotion) { _ in updatePulse() }
        .onChange(of: game.cancelPending) { _ in updatePulse() }
    }

    private var heading: String {
        if game.cancelPending { return game.lang == "fr" ? "Annulation…" : "Cancelling…" }
        return game.lang == "fr" ? "Recherche d’un adversaire" : "Finding an opponent"
    }

    private var atlas: some View {
        ZStack {
            RadialGradient(colors: [Color(hex: 0x202A32), Color(hex: 0x11171D), NativeDuelColors.introCanvas],
                           center: .center, startRadius: 12, endRadius: 215)
            NativeSearchWorld()
                .fill(LinearGradient(colors: [Color(hex: 0x48515B), Color(hex: 0x252E37)], startPoint: .top, endPoint: .bottom))
                .overlay(NativeSearchWorld().stroke(Color(hex: 0x78828B).opacity(0.45), lineWidth: 0.6))
                .scaleEffect(1.08)
            LinearGradient(stops: [.init(color: NativeDuelColors.introCanvas, location: 0), .init(color: .clear, location: 0.20),
                                   .init(color: .clear, location: 0.75), .init(color: NativeDuelColors.introCanvas, location: 1)],
                           startPoint: .top, endPoint: .bottom)
            ForEach(0..<3) { index in
                Circle().strokeBorder(NativeDuelColors.atlasGold.opacity(0.22 - Double(index) * 0.05), lineWidth: 1)
                    .frame(width: CGFloat(130 + index * 70), height: CGFloat(130 + index * 70))
                    .scaleEffect(pulse ? 1.13 : 0.90)
            }
            VStack(spacing: 4) {
                NativePlayerPortrait(avatar: game.avatar, size: 71)
                    .padding(6).background(Color(hex: 0x12191F), in: Circle())
                    .overlay(Circle().strokeBorder(NativeDuelColors.atlasGold.opacity(0.6)))
                    .shadow(color: .black.opacity(0.6), radius: 18, y: 5)
                    .padding(.bottom, 9)
                Text(game.name).font(.headline).multilineTextAlignment(.center)
                    .padding(.horizontal, 9).padding(.vertical, 3)
                    .background(Color(hex: 0x0C1118).opacity(0.8), in: RoundedRectangle(cornerRadius: 5))
                Text("\(game.lang == "fr" ? "Niveau" : "Level") \(game.stats?.level ?? 1)")
                    .font(.caption2).foregroundColor(Color(hex: 0xC4C9CD))
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(Color(hex: 0x0C1118).opacity(0.72), in: RoundedRectangle(cornerRadius: 3))
            }
            .padding(.horizontal, 30)
            .offset(y: 8)
        }
        .clipped()
    }

    private func updatePulse() {
        guard !reduceMotion && !game.cancelPending else {
            withAnimation(nil) { pulse = false }
            return
        }
        withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) { pulse = true }
    }
}
