import Foundation

enum NativeMusicCue: String { case search = "lobby-tv-show", duel = "question-thinking-timer" }
enum NativeSoundCue: String { case correct, wrong }

struct NativeAnswerFeedback: Equatable {
    let id = UUID()
    let correct: Bool
}

struct NativeAudioPolicy {
    var desired: NativeMusicCue?
    var muted = false
    var foreground = true
    var interrupted = false
    private var lastFeedbackID: UUID?

    init(muted: Bool = false) { self.muted = muted }

    var playableCue: NativeMusicCue? { muted || !foreground || interrupted ? nil : desired }
    mutating func consume(_ feedback: NativeAnswerFeedback) -> NativeSoundCue? {
        guard feedback.id != lastFeedbackID else { return nil }
        lastFeedbackID = feedback.id
        guard playableCue == .duel else { return nil }
        return feedback.correct ? .correct : .wrong
    }
}
