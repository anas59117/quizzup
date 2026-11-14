import SwiftUI

struct ContentView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject private var audio: NativeAudioManager
    @Environment(\.scenePhase) private var scenePhase

    private var musicCue: NativeMusicCue? {
        switch game.stage {
        case .waiting: return .search
        case .roundIntro, .question: return .duel
        default: return nil
        }
    }

    var body: some View {
        ZStack {
            Theme.brand.ignoresSafeArea()
            switch game.stage {
            case .authGate: AuthGateView()
            case .join: JoinView()
            case .home: HomeView()
            case .waiting: WaitingView()
            case .roundIntro: RoundIntroView()
            case .question: QuestionView()
            case .finished: ResultView()
            case .error: ErrorView()
            }
        }
        .foregroundColor(game.stage == .home ? nil : Theme.text)
        .preferredColorScheme(game.stage == .home ? nil : .dark)
        .overlay(alignment: .topTrailing) {
            if game.stage == .waiting || game.stage == .roundIntro {
                NativeAudioToggle().padding(.trailing, 16).padding(.top, 6)
            }
        }
        .onAppear {
            game.loadCategories()
            audio.setForeground(scenePhase == .active)
            audio.setContext(musicCue)
        }
        .onChange(of: game.stage) { _ in audio.setContext(musicCue) }
        .onChange(of: game.answerFeedback) { feedback in
            guard let feedback else { return }
            audio.setContext(musicCue)
            audio.playFeedback(feedback)
        }
        .onChange(of: scenePhase) { phase in
            audio.setForeground(phase == .active)
            if phase == .active { game.refreshRoundClock() }
        }
    }
}

struct ErrorView: View {
    @EnvironmentObject var game: GameSocket
    var body: some View {
        VStack(spacing: 16) {
            Text(game.t("connectionLost")).font(.title2.bold())
            Text(game.socialError ?? game.t("serverUnreachable")).foregroundColor(.white).multilineTextAlignment(.center)
            Button(game.t("retry")) { game.retryConnection() }
                .buttonStyle(PrimaryButtonStyle())
        }
        .padding()
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Theme.gold)
            .cornerRadius(12)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}
