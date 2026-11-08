import SwiftUI

struct ContentView: View {
    @EnvironmentObject var game: GameSocket

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
        .foregroundColor(Theme.text)
        .onAppear { game.loadCategories() }
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
