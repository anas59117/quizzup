import SwiftUI

struct ContentView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            switch game.stage {
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
            Text("Connexion perdue").font(.title2.bold())
            Text("Impossible de joindre le serveur.").foregroundColor(Theme.textDim)
            Button("Réessayer") { game.stage = .home }
                .buttonStyle(PrimaryButtonStyle())
        }
        .padding()
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Theme.accent)
            .cornerRadius(12)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}
