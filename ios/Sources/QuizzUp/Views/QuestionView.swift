import SwiftUI

struct QuestionView: View {
    @EnvironmentObject var game: GameSocket

    private var revealing: Bool { game.reveal != nil }

    var body: some View {
        guard let q = game.question else { return AnyView(EmptyView()) }
        return AnyView(
            ScrollView {
            VStack(spacing: 14) {
                VStack(spacing: 2) {
                    Text(game.t("time")).font(.caption2.bold()).foregroundColor(Theme.textDim)
                    Text(revealing ? "✓" : "\(game.timeLeft)")
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundColor(game.timeLeft <= 3 && !revealing ? .red : Theme.gold)
                }

                if !game.opponents.isEmpty {
                    HStack {
                        ForEach(game.opponents) { o in
                            Text("\(o.avatar) \(o.name)").font(.caption2).foregroundColor(Theme.textDim)
                        }
                    }
                }

                if let image = q.image, let url = GameSocket.absoluteImageURL(image) {
                    AsyncImage(url: url) { phase in
                        if let img = phase.image {
                            img.resizable().scaledToFill()
                        } else {
                            Theme.surface2
                        }
                    }
                    .frame(width: 160, height: 160)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.white.opacity(0.5), lineWidth: 3))
                    .blur(radius: revealing ? 0 : max(0, (1 - Double(game.timeLeft) / Double(q.timeLimit)) * 18))
                    if revealing, let credit = q.credit {
                        Text(credit).font(.caption2).foregroundColor(Theme.textDim)
                    }
                }

                Text(q.question)
                    .font(.title3.bold())
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(Array(q.answers.enumerated()), id: \.offset) { idx, answerText in
                        AnswerButton(
                            text: answerText,
                            style: style(for: idx),
                            disabled: game.selectedAnswer != nil || revealing
                        ) { game.answer(idx) }
                    }
                }
                .padding(.horizontal)

                if let reveal = game.reveal {
                    Text(reveal.yourCorrect ? game.t("ptsEarned", ["n": "\(reveal.pointsEarned)"]) : (reveal.yourAnswer == nil ? game.t("timeUp") : game.t("wrong")))
                        .font(.headline)
                        .foregroundColor(reveal.yourCorrect ? Theme.green : Theme.red)
                }

                Spacer(minLength: 12)
            }
            .padding(.top, 20)
            }
        )
    }

    private func style(for idx: Int) -> AnswerButtonStyle {
        guard let reveal = game.reveal else {
            return game.selectedAnswer == idx ? .selected : .normal
        }
        if idx == reveal.correctIndex { return .correct }
        if idx == game.selectedAnswer { return .wrong }
        return .dim
    }
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
                .font(.subheadline.bold())
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(background)
                .foregroundColor(foreground)
                .cornerRadius(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(style == .selected ? Theme.accent : Theme.border, lineWidth: style == .selected ? 3 : 1)
                )
                .opacity(style == .dim ? 0.35 : 1)
        }
        .disabled(disabled)
    }

    private var background: Color {
        switch style {
        case .correct: return Theme.green
        case .wrong: return Theme.red
        default: return Theme.surface
        }
    }

    private var foreground: Color {
        switch style {
        case .correct, .wrong: return .white
        default: return Theme.text
        }
    }
}
