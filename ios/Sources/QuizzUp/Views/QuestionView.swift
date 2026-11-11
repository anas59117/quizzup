import SwiftUI
import UIKit

// Answer visibility and selection are driven by the server timeline. The arena
// reserves the choices' layout during reading so the prompt never moves.
struct QuestionView: View {
    @EnvironmentObject var game: GameSocket
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .title2) private var questionSize: CGFloat = 24
    @State private var questionArtwork: (url: URL, image: UIImage)?
    @State private var failedImageURL: URL?

    var body: some View {
        GeometryReader { geometry in
            let screenHeight = geometry.size.height + geometry.safeAreaInsets.top + geometry.safeAreaInsets.bottom
            if let question = game.question {
                ScrollView {
                    VStack(spacing: 4) {
                        duelHeader(question, compact: screenHeight <= 620)
                        roundDetails(question)
                        arena(question, screenHeight: screenHeight, safeHeight: geometry.size.height)
                        footer
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, min(30, max(14, screenHeight * 0.035)))
                    .padding(.bottom, 12)
                    .frame(maxWidth: 520)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .background(NativeDuelColors.arena.ignoresSafeArea())
        .foregroundColor(Color(hex: 0xF7F5F0))
    }

    private func roundDetails(_ question: Question) -> some View {
        HStack(spacing: 8) {
            Color.clear.frame(width: 44, height: 1).accessibilityHidden(true)
            HStack(spacing: 8) {
                Text("Question \(question.round) / \(question.totalRounds)")
                    .font(.caption).foregroundColor(Color(hex: 0xBFC2BD))
                    .layoutPriority(1)
                if !question.category.isEmpty {
                    Text(question.category).font(.caption2.weight(.semibold)).tracking(0.4)
                        .foregroundColor(Color(hex: 0xDEDFD9)).lineLimit(1)
                        .padding(.horizontal, 12).padding(.vertical, 5)
                        .background(Color(hex: 0x262A27), in: Capsule())
                        .overlay(Capsule().strokeBorder(Color(hex: 0x424641)))
                }
            }
            .frame(maxWidth: .infinity)
            .accessibilityElement(children: .combine)
            Group {
                if game.opponents.count == 1, let opponent = game.opponents.first {
                    moderation(opponent)
                } else {
                    Color.clear.frame(width: 44, height: 1).accessibilityHidden(true)
                }
            }
        }
        .frame(minHeight: 44)
    }

    private func arena(_ question: Question, screenHeight: CGFloat, safeHeight: CGFloat) -> some View {
        let hasPhoto = question.image != nil
        let compact = screenHeight <= 620
        let group = game.opponents.count > 1
        let minimumHeight = !group && screenHeight >= 650 ? max(0, safeHeight - 192) : 0

        return VStack(spacing: 0) {
            Text(question.question)
                .font(.system(size: questionSize * (compact ? 0.78 : hasPhoto ? 0.92 : 1), weight: .bold))
                .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
                .accessibilityAddTraits(.isHeader)
            if let image = question.image, let url = GameSocket.absoluteImageURL(image) {
                let photoHeight = compact ? min(144, max(82, safeHeight - 370)) : min(290, max(90, safeHeight - 510))
                questionImage(url, credit: question.credit)
                    .frame(height: photoHeight).padding(.top, compact ? 10 : 16)
            }
            answers(question, screenHeight: screenHeight)
                .padding(.top, compact || hasPhoto ? 12 : screenHeight < 740 ? 20 : 30)
                .opacity(game.answersVisible ? 1 : 0)
                .accessibilityHidden(!game.answersVisible)
                .allowsHitTesting(game.answersVisible)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: game.answersVisible)
        }
        .padding(.top, compact ? 10 : hasPhoto ? 16 : 18)
        .padding(.bottom, compact ? 12 : 24)
        .frame(minHeight: minimumHeight, alignment: hasPhoto ? .top : .center)
        .padding(.leading, 16)
        .padding(.trailing, CGFloat(max(16, game.opponents.count * 9 + 7)))
        .overlay(alignment: .leading) {
            NativeScoreRail(score: game.score, maximum: scoreMaximum(question), color: NativeDuelColors.mine)
        }
        .overlay(alignment: .trailing) {
            HStack(spacing: 1) {
                ForEach(game.opponents.reversed()) { opponent in
                    NativeScoreRail(score: opponent.score, maximum: scoreMaximum(question), color: NativeDuelColors.other)
                }
            }
        }
    }

    private func scoreMaximum(_ question: Question) -> Int { (max(1, question.totalRounds) + 1) * 20 }

    private func duelHeader(_ question: Question, compact: Bool) -> some View {
        let group = game.opponents.count > 1
        let timer = NativeDuelTimer(seconds: game.timeLeft, limit: question.timeLimit,
                                   revealing: game.reveal != nil, compact: compact)
            .accessibilityLabel(game.t("time"))

        return VStack(spacing: 8) {
            if group { timer }
            HStack(alignment: .top, spacing: group ? 6 : 7) {
                let answered = game.reveal.map { $0.yourAnswer != nil } ?? (game.selectedAnswer != nil)
                let correct = game.reveal?.yourCorrect ?? (game.answerAccepted ? game.answerCorrect : nil)
                let points = game.reveal?.pointsEarned ?? game.answerPoints
                player(avatar: game.avatar, name: game.name, score: game.score, answered: answered, correct: correct,
                       points: points, mine: true, compact: compact, grouped: group)
                if !group { timer }
                if game.opponents.isEmpty { Spacer(minLength: 0).frame(maxWidth: .infinity) }
                ForEach(game.opponents) { opponent in
                    player(avatar: opponent.avatar, name: opponent.name, score: opponent.score, answered: opponent.answered,
                           correct: game.reveal == nil ? nil : opponent.correct, mine: false, compact: compact, grouped: group)
                }
            }
            .frame(minHeight: compact ? 58 : 72, alignment: .top)
        }
    }

    private func player(avatar: String, name: String, score: Int, answered: Bool, correct: Bool?, points: Int? = nil,
                        mine: Bool, compact: Bool, grouped: Bool) -> some View {
        let state: NativeDuelAnswerState
        let status: String
        if answered, let correct {
            state = correct ? .correct : .wrong
            status = correct ? (points.map { game.t("ptsEarned", ["n": "\($0)"]) } ?? correctAnswer) : wrongAnswer
        } else if game.reveal != nil {
            state = .timeout
            status = game.t("timeUp")
        } else if answered {
            state = .submitted
            status = submitted
        } else {
            state = .waiting
            status = copy("En attente…", "Waiting…")
        }
        return NativeDuelPlayer(avatar: avatar, name: name, score: score,
                                color: mine ? NativeDuelColors.mine : NativeDuelColors.other,
                                state: state, status: status, trailing: !mine, compact: compact, stacked: grouped)
    }

    private func questionImage(_ url: URL, credit: String?) -> some View {
        Color(hex: 0x1D211E)
            .overlay {
                if let image = NativeImageCache.shared.cachedImage(for: url)
                    ?? (questionArtwork?.url == url ? questionArtwork?.image : nil) {
                    Image(uiImage: image).resizable().scaledToFit()
                } else if failedImageURL == url {
                    Image(systemName: "photo").font(.largeTitle).foregroundColor(NativeDuelColors.secondary)
                } else { ProgressView().tint(Theme.paper) }
            }
            .overlay(alignment: .bottomLeading) {
                if game.answerAccepted || game.reveal != nil, let credit, !credit.isEmpty {
                    Text(credit).font(.caption2).foregroundColor(.white)
                        .padding(.horizontal, 6).padding(.vertical, 3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.black.opacity(0.87))
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .accessibilityLabel(copy("Illustration de la question", "Question illustration"))
            .task(id: url) {
                let image = await NativeImageCache.shared.load(url)
                guard !Task.isCancelled else { return }
                if let image { questionArtwork = (url, image); failedImageURL = nil }
                else { failedImageURL = url }
            }
    }

    private func answers(_ question: Question, screenHeight: CGFloat) -> some View {
        let hasPhoto = question.image != nil
        let columns = hasPhoto ? 2 : 1
        let rowCount = (question.answers.count + columns - 1) / columns
        let minimumHeight = screenHeight <= 620 ? 44 : hasPhoto ? (screenHeight < 740 ? 64 : 76) : min(88, max(60, screenHeight * 0.095))
        let fontSize: CGFloat = screenHeight <= 620 ? 15 : hasPhoto ? (screenHeight < 740 ? 16 : 18) : (screenHeight < 740 ? 18 : 19)
        let spacing: CGFloat = screenHeight <= 620 ? 7 : 10

        return Grid(horizontalSpacing: spacing, verticalSpacing: spacing) {
            ForEach(0..<rowCount, id: \.self) { row in
                let start = row * columns
                let end = min(start + columns, question.answers.count)
                GridRow {
                    ForEach(start..<end, id: \.self) { index in
                        AnswerButton(text: question.answers[index], style: style(for: index),
                                     disabled: !game.answerInputOpen || game.selectedAnswer != nil || game.reveal != nil,
                                     minimumHeight: minimumHeight, fontSize: fontSize) { game.answer(index) }
                            .gridCellColumns(end - start == 1 ? columns : 1)
                    }
                }
            }
        }
    }

    private var footer: some View {
        HStack(alignment: .center, spacing: 6) {
            feedback.frame(maxWidth: .infinity, alignment: .leading)
            if game.opponents.count > 1 {
                ForEach(game.opponents) { opponent in moderation(opponent) }
            }
        }
        .frame(minHeight: 44)
    }

    private func moderation(_ opponent: Opponent) -> some View {
        ReportBlockButton(targetId: opponent.clientId ?? opponent.id, targetName: opponent.name,
                          foreground: Color(hex: 0xF4EFE4))
            .accessibilityLabel(game.t("reportPlayer") + " " + opponent.name)
    }

    @ViewBuilder private var feedback: some View {
        if let reveal = game.reveal {
            VStack(alignment: .leading, spacing: 4) {
                Text(reveal.yourCorrect ? correctAnswer : reveal.yourAnswer == nil ? game.t("timeUp") : wrongAnswer)
                    .fontWeight(.bold).foregroundColor(reveal.yourCorrect ? NativeDuelColors.correct : NativeDuelColors.wrong)
                if reveal.yourCorrect {
                    Text(game.t("ptsEarned", ["n": "\(reveal.pointsEarned)"]))
                } else if let question = game.question, question.answers.indices.contains(reveal.correctIndex) {
                    Text(copy("La bonne réponse était :", "The correct answer was:") + " " + question.answers[reveal.correctIndex])
                }
            }.font(.caption)
        } else if game.answerAccepted, let correct = game.answerCorrect {
            VStack(alignment: .leading, spacing: 4) {
                Text(correct ? correctAnswer : wrongAnswer)
                    .fontWeight(.bold).foregroundColor(correct ? NativeDuelColors.correct : NativeDuelColors.wrong)
                if correct { Text(game.t("ptsEarned", ["n": "\(game.answerPoints)"])) }
            }.font(.caption)
        } else if game.selectedAnswer != nil {
            Text(submitted).font(.caption).foregroundColor(NativeDuelColors.secondary)
        } else {
            Color.clear.frame(height: 1).accessibilityHidden(true)
        }
    }

    private func style(for index: Int) -> AnswerButtonStyle {
        guard let reveal = game.reveal else {
            guard game.selectedAnswer == index else { return .normal }
            if game.answerAccepted, let correct = game.answerCorrect { return correct ? .correct : .wrong }
            return .selected
        }
        if index == reveal.correctIndex { return .correct }
        if index == reveal.yourAnswer { return .wrong }
        return .dim
    }

    private var correctAnswer: String { copy("Bonne réponse", "Correct answer") }
    private var wrongAnswer: String { copy("Mauvaise réponse", "Incorrect answer") }
    private var submitted: String { copy("Réponse envoyée", "Answer submitted") }
    private func copy(_ french: String, _ english: String) -> String { game.lang == "fr" ? french : english }
}

private enum AnswerButtonStyle { case normal, selected, correct, wrong, dim }

private struct AnswerButton: View {
    @ScaledMetric(relativeTo: .body) private var typeScale: CGFloat = 1
    let text: String
    let style: AnswerButtonStyle
    let disabled: Bool
    let minimumHeight: CGFloat
    let fontSize: CGFloat
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: fontSize * typeScale, weight: .bold)).multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 24).padding(.vertical, minimumHeight == 44 ? 9 : 12)
                .frame(maxWidth: .infinity, minHeight: minimumHeight)
                .background(background, in: RoundedRectangle(cornerRadius: 12))
                .foregroundColor(style == .correct || style == .wrong ? .white : Color(hex: 0x151615))
                .overlay {
                    RoundedRectangle(cornerRadius: 12).strokeBorder(border, lineWidth: style == .selected ? 2 : 1)
                }
                .overlay(alignment: .trailing) {
                    if style == .correct || style == .wrong {
                        Image(systemName: style == .correct ? "checkmark" : "xmark")
                            .font(.caption.weight(.heavy)).foregroundColor(.white).padding(.trailing, 7)
                            .accessibilityHidden(true)
                    }
                }
                .contentShape(RoundedRectangle(cornerRadius: 12))
                .opacity(style == .dim ? 0.7 : 1)
        }
        .buttonStyle(NativeAnswerPressStyle()).disabled(disabled)
        .accessibilityAddTraits(style == .selected ? .isSelected : [])
        .accessibilityValue(style == .correct ? "✓" : style == .wrong ? "✕" : "")
    }

    private var background: Color {
        switch style {
        case .selected: return Color(hex: 0xD9F2FC)
        case .correct: return Color(hex: 0x125B37)
        case .wrong: return Color(hex: 0x702833)
        default: return Color(hex: 0xF7F2E8)
        }
    }
    private var border: Color {
        switch style {
        case .selected: return NativeDuelColors.mine
        case .correct: return NativeDuelColors.correct
        case .wrong: return Color(hex: 0xFFA1AC)
        default: return Color(hex: 0xE1DED4)
        }
    }
}

private struct NativeAnswerPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(configuration.isPressed ? 0.9 : 1)
    }
}
