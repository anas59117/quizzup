import Foundation

enum NativeMusicCue: String { case search = "lobby-tv-show", duel = "question-thinking-timer" }
enum NativeSoundCue: String { case correct, wrong, victory }

struct NativeAnswerFeedback: Equatable {
    let id = UUID()
    let correct: Bool
}

struct NativeVictoryFeedback {
    let id = UUID()
    let won: Bool
    let tie: Bool
    let solo: Bool
}

struct NativeAudioPolicy {
    var desired: NativeMusicCue?
    var muted = false
    var foreground = true
    var interrupted = false
    private var lastFeedbackID: UUID?
    private var lastVictoryID: UUID?

    init(muted: Bool = false) { self.muted = muted }

    var playableCue: NativeMusicCue? { muted || !foreground || interrupted ? nil : desired }
    mutating func consume(_ feedback: NativeAnswerFeedback) -> NativeSoundCue? {
        guard feedback.id != lastFeedbackID else { return nil }
        lastFeedbackID = feedback.id
        guard playableCue == .duel else { return nil }
        return feedback.correct ? .correct : .wrong
    }

    mutating func consume(_ feedback: NativeVictoryFeedback) -> NativeSoundCue? {
        guard feedback.id != lastVictoryID else { return nil }
        lastVictoryID = feedback.id
        guard !muted, foreground, !interrupted, feedback.won, !feedback.tie, !feedback.solo else { return nil }
        return .victory
    }
}
