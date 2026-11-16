import SwiftUI

// Editorial gaming: cream surfaces, red ink accents, yellow actions.
// Dynamic text and generous targets keep this optional help readable.
// The live practice clock is the only motion; no audio or game side effects.
struct NativeOnboardingSkip: View {
    @EnvironmentObject var game: GameSocket
    var action: (() -> Void)? = nil
    var body: some View {
        Button(game.lang == "fr" ? "Passer le tutoriel" : "Skip tutorial") {
            if let action { action() } else { game.updateOnboarding(.skip) }
        }
        .font(.body.weight(.semibold)).underline()
        .foregroundColor(Theme.accent).frame(minHeight: 44)
        .buttonStyle(.plain)
    }
}

struct NativeOnboardingWelcome: View {
    @EnvironmentObject var game: GameSocket
    let onChoose: () -> Void
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(fr ? "Ton premier quiz t’attend" : "Your first quiz is waiting")
                .font(.title.bold()).accessibilityAddTraits(.isHeader)
            Text(fr ? "Choisis un thème qui te plaît. On t’explique la partie au moment de jouer." : "Pick a topic you love. We’ll explain the game when you play.")
                .font(.body).foregroundColor(Theme.muted)
            Button(fr ? "Choisir mon premier quiz" : "Choose my first quiz") {
                game.updateOnboarding(.complete)
                onChoose()
            }.buttonStyle(PrimaryButtonStyle())
            NativeOnboardingSkip()
        }
        .padding(18).foregroundColor(Theme.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
    }
}

struct NativeOnboardingCommunityHint: View {
    @EnvironmentObject var game: GameSocket
    let onOpen: () -> Void
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(fr ? "L’icône Communauté, juste au-dessus" : "The Community icon, just above", systemImage: "person.2")
                .font(.headline).accessibilityAddTraits(.isHeader)
            Text(fr ? "Retrouve les discussions des thèmes, publie et échange avec les autres joueurs." : "Find topic discussions, post and chat with other players.")
                .font(.body).foregroundColor(Theme.muted)
            Button(fr ? "Découvrir la communauté" : "Explore the community") {
                game.updateOnboarding(.community); onOpen()
            }.font(.body.bold()).frame(minHeight: 44).foregroundColor(Theme.accent)
            NativeOnboardingSkip()
        }.padding(16).foregroundColor(Theme.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.paper, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct NativeOnboardingGuide: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    var solo = false
    var manual = false
    var initialPractice = false
    @State private var practicing = false
    @State private var practice: NativePracticeRound?
    @State private var now = Date()
    @State private var selectedSolo = false
    private var fr: Bool { game.lang == "fr" }
    private var modeSolo: Bool { manual ? selectedSolo : solo }
    private var seconds: Int { practice?.seconds(at: now) ?? 10 }
    private var answered: Bool { practice?.selected != nil || seconds == 0 }
    private func copy(_ fr: String, _ en: String) -> String { self.fr ? fr : en }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(copy(manual ? "Comment jouer" : "Avant de jouer", manual ? "How to play" : "Before you play"))
                    .font(.headline).accessibilityAddTraits(.isHeader)
                Spacer(minLength: 8)
                Button(copy("Fermer", "Close")) { dismiss() }.frame(minHeight: 44)
            }.padding(.horizontal, 20)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if practicing { trial } else { rules }
                    if let error = game.onboardingSyncError, !manual {
                        Text(error).font(.footnote).foregroundColor(Theme.muted)
                    }
                }.padding(20).frame(maxWidth: 520).frame(maxWidth: .infinity)
            }
            // Kept outside scrolling content, including during the trial and its feedback.
            NativeOnboardingSkip(action: {
                if !manual { game.updateOnboarding(.skip) }
                dismiss()
            }).padding(.horizontal, 20).padding(.bottom, 12)
        }
        .background(Theme.paper.ignoresSafeArea()).foregroundColor(Theme.ink).tint(Theme.accent)
        .onAppear {
            selectedSolo = solo
            if initialPractice { beginPractice() }
        }
        .task(id: practice?.startedAt) {
            guard practice != nil else { return }
            while !Task.isCancelled && seconds > 0 && practice?.selected == nil {
                now = Date()
                try? await Task.sleep(nanoseconds: 100_000_000)
            }
        }
    }

    private var rules: some View {
        VStack(alignment: .leading, spacing: 18) {
            if manual {
                Picker(copy("Mode de jeu", "Game mode"), selection: $selectedSolo) {
                    Text("Solo").tag(true)
                    Text(copy("Duel", "Duel")).tag(false)
                }.pickerStyle(.segmented)
            }
            Text(modeSolo ? copy("À toi de jouer.", "Your turn to play.") : copy("Un thème. Un duel.", "One topic. One duel."))
                .font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
            Text(modeSolo
                 ? copy("Tu joues seul : réponds aux questions du thème choisi et découvre ton score à la fin.", "Play on your own: answer questions on your chosen topic and see your score at the end.")
                 : copy("Tu affrontes un autre joueur sur le même quiz. Le meilleur score remporte le duel.", "Face another player on the same quiz. The highest score wins the duel."))
            Text(copy("Lis la question, puis choisis une des 4 réponses avant la fin du chrono. Une bonne réponse rapide rapporte davantage de points. Tu verras la bonne réponse après chaque question.", "Read the question, then choose one of 4 answers before the timer ends. A quick correct answer earns more points. The correct answer appears after each question."))
                .foregroundColor(Theme.muted)
            if !manual {
                Button(copy(modeSolo ? "Commencer en solo" : "Lancer le duel", modeSolo ? "Start solo" : "Start duel")) {
                    game.beginOnboardingMatch()
                    dismiss()
                }.buttonStyle(PrimaryButtonStyle())
            }
            Button(copy("Essayer une question", "Try a question"), action: beginPractice)
                .font(.body.bold()).frame(minHeight: 44).foregroundColor(Theme.accent)
            Text(copy("Entraînement facultatif, sans adversaire, XP ni statistiques.", "Optional practice, with no opponent, XP or statistics."))
                .font(.footnote).foregroundColor(Theme.muted)
            if manual {
                Divider()
                Text(copy("Score et niveaux", "Score and levels")).font(.title2.bold())
                Text(copy("Le score sert à départager la partie. Le niveau global progresse avec l’XP de tes parties. Chaque quiz a aussi son propre niveau, visible sur sa fiche.", "Your score decides the match. Your global level grows with XP from games. Each quiz also has its own level, shown on its page."))
                Label(copy("Communauté", "Community"), systemImage: "person.2").font(.title2.bold())
                Text(copy("Depuis l’icône aux deux personnes en haut de l’accueil, retrouve les discussions et partage avec les joueurs de tes thèmes.", "Use the two-person icon at the top of Home to find discussions and share with players of your topics."))
            }
        }.font(.body).fixedSize(horizontal: false, vertical: true)
    }

    private var trial: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(copy("Entraînement", "Practice")).font(.title.bold()).accessibilityAddTraits(.isHeader)
            Text(copy("Sans adversaire · sans XP · sans statistiques", "No opponent · no XP · no statistics"))
                .font(.subheadline).foregroundColor(Theme.muted)
            HStack {
                Image(systemName: "timer")
                Text(copy("\(seconds) secondes", "\(seconds) seconds")).monospacedDigit().font(.headline)
            }.accessibilityElement(children: .combine)
            Text(copy("Combien de planètes compte le système solaire ?", "How many planets are in the Solar System?"))
                .font(.title2.bold()).fixedSize(horizontal: false, vertical: true)
            ForEach(0..<4) { index in
                Button {
                    now = Date(); practice?.answer(index, at: now)
                } label: {
                    HStack {
                        Text(["7", "8", "9", "10"][index]).font(.title3.bold())
                        Spacer()
                        if answered && index == 1 { Image(systemName: "checkmark.circle.fill") }
                        else if practice?.selected == index { Image(systemName: "xmark.circle") }
                    }.padding(14).frame(maxWidth: .infinity, minHeight: 54)
                        .background(answered && index == 1 ? Theme.challengeBackground : Theme.field,
                                    in: RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).disabled(answered)
                    .accessibilityLabel("\(["7", "8", "9", "10"][index])\(answered && index == 1 ? copy(", bonne réponse", ", correct answer") : "")")
            }
            if answered {
                Text(practice?.correct == true ? copy("Bien joué ! La bonne réponse est 8.", "Well done! The correct answer is 8.")
                     : copy("La bonne réponse est 8. Tu pourras réessayer dans un vrai quiz !", "The correct answer is 8. You can try again in a real quiz!"))
                    .font(.headline).accessibilityAddTraits(.updatesFrequently)
                Text(copy("Dans une vraie partie, précision et rapidité font monter ton score.", "In a real game, accuracy and speed increase your score."))
                    .foregroundColor(Theme.muted)
                Button(copy("Revenir aux règles", "Back to rules")) { practicing = false; practice = nil }
                    .buttonStyle(PrimaryButtonStyle())
            }
        }
    }

    private func beginPractice() {
        now = Date(); practice = NativePracticeRound(startedAt: now); practicing = true
    }
}

struct NativeOnboardingProgression: View {
    @EnvironmentObject var game: GameSocket
    let result: GameEnd
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(fr ? "Ton score, tes niveaux" : "Your score, your levels").font(.title2.bold())
                .accessibilityAddTraits(.isHeader)
            Text(fr ? "\(result.finalScore) points : le score de cette partie. En duel, il détermine le gagnant." : "\(result.finalScore) points: this game’s score. In a duel it decides the winner.")
            if let stats = result.stats {
                Text(fr ? "Niveau global \(stats.level) : tu as gagné \(result.xp) XP dans cette partie." : "Global level \(stats.level): you earned \(result.xp) XP in this game.")
            }
            Text(fr ? "Le niveau du quiz suit ta progression dans ce thème. Retrouve-le sur la fiche du quiz." : "A quiz’s level tracks your progress in that topic. Find it on the quiz’s page.")
            Button(fr ? "Compris" : "Got it") {
                game.updateOnboarding(.progression); game.onboardingProgressionVisible = false
            }.buttonStyle(PrimaryButtonStyle())
            NativeOnboardingSkip()
        }.font(.body).padding(18).foregroundColor(Theme.ink)
            .background(Theme.paper, in: RoundedRectangle(cornerRadius: 18))
    }
}
