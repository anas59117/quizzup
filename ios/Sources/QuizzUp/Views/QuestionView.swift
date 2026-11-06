import SwiftUI

// Website duel: dark canvas, ivory choices, cyan and copper score rails.
// The question keeps its place while server timing reveals the answers.
struct QuestionView: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Theme.canvas.ignoresSafeArea()
            if let question = game.question {
                ScrollView {
                    VStack(spacing: 18) {
                        duelHeader(question)
                        arena(question)
                    }
                    .padding(.horizontal, 16).padding(.top, 18).padding(.bottom, 20)
                }
            }
        }.foregroundColor(Theme.paper)
    }

    private func arena(_ question: Question) -> some View {
        VStack(spacing: 18) {
            VStack(spacing: 9) {
                Text(game.t("roundOf", ["n": "\(question.round)", "total": "\(question.totalRounds)"]))
                    .font(.caption).foregroundColor(NativeDuelColors.secondary)
                Text(question.category.uppercased())
                    .font(.caption2.weight(.bold)).tracking(1.1)
                    .padding(.horizontal, 16).padding(.vertical, 7)
                    .background(Color.white.opacity(0.07), in: Capsule())
            }
            Text(question.question)
                .font(.title2.weight(.bold)).multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: question.image == nil ? 98 : 60)
                .accessibilityAddTraits(.isHeader)
            if let image = question.image, let url = GameSocket.absoluteImageURL(image) {
                questionImage(url, credit: question.credit)
            }
            answers(question)
                .opacity(game.answersVisible ? 1 : 0)
                .accessibilityHidden(!game.answersVisible)
                .allowsHitTesting(game.answersVisible)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: game.answersVisible)
            feedback
                .font(.subheadline.weight(.semibold)).multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, minHeight: 42)
        }
        .padding(.horizontal, 17)
        .overlay(alignment: .leading) {
            NativeScoreRail(score: game.score, maximum: scoreMaximum, color: NativeDuelColors.mine)
        }
        .overlay(alignment: .trailing) {
            HStack(spacing: 3) {
                ForEach(game.opponents) { opponent in
                    NativeScoreRail(score: opponent.score, maximum: scoreMaximum, color: NativeDuelColors.other)
                }
            }
        }
    }

    private var scoreMaximum: Int { (max(1, game.totalRounds) + 1) * 20 }

    private func duelHeader(_ question: Question) -> some View {
        HStack(alignment: .top, spacing: 10) {
            NativeDuelPlayer(avatar: game.avatar, name: game.name, score: game.score,
                             color: NativeDuelColors.mine, answered: game.answerAccepted || game.reveal != nil,
                             correct: game.reveal?.yourCorrect ?? (game.answerAccepted ? game.answerCorrect : nil), status: playerStatus)
            NativeDuelTimer(seconds: game.timeLeft, limit: question.timeLimit,
                            reading: !game.answersVisible, revealing: game.reveal != nil)
                .accessibilityLabel(game.t("time"))
            VStack(alignment: .trailing, spacing: 4) {
                ForEach(game.opponents) { opponent in
                    NativeDuelPlayer(avatar: opponent.avatar, name: opponent.name, score: opponent.score,
                                     color: NativeDuelColors.other, answered: opponent.answered,
                                     correct: game.reveal == nil ? nil : opponent.correct,
                                     status: opponent.answered ? copy("A répondu", "Answered") : copy("En jeu", "Playing"), trailing: true)
                    ReportBlockButton(targetId: opponent.clientId ?? opponent.id, targetName: opponent.name)
                        .frame(minWidth: 44, minHeight: 44)
                        .accessibilityLabel(game.t("reportPlayer") + " " + opponent.name)
                }
            }.frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private var playerStatus: String {
        if game.reveal != nil { return copy("Terminé", "Finished") }
        if game.answerAccepted { return copy("A répondu", "Answered") }
        if game.selectedAnswer != nil { return copy("Envoi…", "Sending…") }
        return copy("À toi de jouer", "Your turn")
    }

    private func questionImage(_ url: URL, credit: String?) -> some View {
        Color.white.opacity(0.05)
            .aspectRatio(16.0 / 9.0, contentMode: .fit)
            .overlay {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFit()
                    } else if phase.error != nil {
                        Image(systemName: "photo").font(.largeTitle).foregroundColor(NativeDuelColors.secondary)
                    } else { ProgressView().tint(Theme.paper) }
                }
            }
            .overlay(alignment: .bottomLeading) {
                if let credit, !credit.isEmpty {
                    Text(credit).font(.caption2).foregroundColor(.white)
                        .padding(5).frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.black.opacity(0.7))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .accessibilityLabel(copy("Illustration de la question", "Question illustration"))
    }

    private func answers(_ question: Question) -> some View {
        let columns = question.image == nil ? [GridItem(.flexible())] : [GridItem(.flexible()), GridItem(.flexible())]
        return LazyVGrid(columns: columns, spacing: 10) {
            ForEach(Array(question.answers.enumerated()), id: \.offset) { index, text in
                AnswerButton(text: text, style: style(for: index),
                             disabled: !game.answerInputOpen || game.selectedAnswer != nil || game.reveal != nil) {
                    game.answer(index)
                }
            }
        }
    }

    @ViewBuilder private var feedback: some View {
        if let reveal = game.reveal {
            Label(reveal.yourCorrect ? game.t("ptsEarned", ["n": "\(reveal.pointsEarned)"]) : (reveal.yourAnswer == nil ? game.t("timeUp") : game.t("wrong")),
                  systemImage: reveal.yourCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(reveal.yourCorrect ? Color(hex: 0x8DE9AF) : Color(hex: 0xFFABB2))
        } else if game.answerAccepted {
            VStack(spacing: 5) {
                Label(game.answerCorrect == false ? game.t("wrong") : copy("Réponse enregistrée", "Answer recorded"),
                      systemImage: game.answerCorrect == false ? "xmark.circle.fill" : "checkmark.circle.fill")
                    .foregroundColor(game.answerCorrect == false ? Color(hex: 0xFFABB2) : NativeDuelColors.mine)
                if game.answerPoints > 0 {
                    Text(game.t("ptsEarned", ["n": "\(game.answerPoints)"])).foregroundColor(Theme.gold)
                }
                Text(copy("En attente de l’adversaire…", "Waiting for your opponent…")).foregroundColor(NativeDuelColors.secondary)
            }
        } else if game.selectedAnswer != nil {
            Text(copy("Envoi de la réponse…", "Sending your answer…")).foregroundColor(NativeDuelColors.secondary)
        } else if !game.answerInputOpen {
            Text(copy("Lis la question…", "Read the question…")).foregroundColor(NativeDuelColors.secondary)
        } else {
            Text(copy("Choisis ta réponse", "Choose your answer")).foregroundColor(NativeDuelColors.secondary)
        }
    }

    private func style(for index: Int) -> AnswerButtonStyle {
        guard let reveal = game.reveal else {
            guard game.selectedAnswer == index else { return .normal }
            if game.answerAccepted, let correct = game.answerCorrect { return correct ? .correct : .wrong }
            return .selected
        }
        if index == reveal.correctIndex { return .correct }
        if index == game.selectedAnswer { return .wrong }
        return .dim
    }
    private func copy(_ french: String, _ english: String) -> String { game.lang == "fr" ? french : english }
}

enum AnswerButtonStyle { case normal, selected, correct, wrong, dim }

struct AnswerButton: View {
    let text: String
    let style: AnswerButtonStyle
    let disabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.title3.weight(.bold)).multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: 34)
                .padding(.horizontal, 18).padding(.vertical, 17)
                .background(background, in: RoundedRectangle(cornerRadius: 11))
                .foregroundColor(style == .correct || style == .wrong ? .white : Theme.ink)
                .overlay {
                    RoundedRectangle(cornerRadius: 11).stroke(border, lineWidth: style == .selected ? 3 : 1)
                }
                .overlay(alignment: .trailing) {
                    if style == .correct || style == .wrong {
                        Image(systemName: style == .correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .font(.caption).foregroundColor(.white).padding(.trailing, 6)
                    }
                }
                .opacity(style == .dim ? 0.32 : 1)
        }
        .buttonStyle(.plain).disabled(disabled)
        .accessibilityAddTraits(style == .selected ? .isSelected : [])
        .accessibilityValue(style == .correct ? "✓" : style == .wrong ? "✕" : "")
    }
    private var background: Color {
        switch style {
        case .selected: return Color(hex: 0xD9F2FC)
        case .correct: return Color(hex: 0x125B37)
        case .wrong: return Color(hex: 0x702833)
        default: return Theme.paper
        }
    }
    private var border: Color {
        switch style {
        case .selected: return NativeDuelColors.mine
        case .correct: return Color(hex: 0x77EFAF)
        case .wrong: return Color(hex: 0xFFA1AC)
        default: return Theme.paper.opacity(0.7)
        }
    }
}
