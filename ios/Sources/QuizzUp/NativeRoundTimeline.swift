import Foundation

/// All offsets are relative to receipt of the server question. Reading never
/// consumes answer time; a reconnect resumes the server's remaining budget.
struct NativeRoundTimeline {
    let receivedAt: Date
    let opensAfter: TimeInterval
    let revealsAfter: TimeInterval
    let remaining: TimeInterval

    init(question: Question, receivedAt: Date = Date()) {
        self.receivedAt = receivedAt
        opensAfter = max(0, question.answerOpensInMs ?? 0) / 1000
        revealsAfter = max(0, (question.readingMs ?? 0) - (question.presentationElapsedMs ?? 0)) / 1000
        remaining = max(0, min(Double(question.timeLimit), (question.remainingMs ?? Double(question.timeLimit * 1000)) / 1000))
    }

    func state(at date: Date) -> (visible: Bool, open: Bool, seconds: Int) {
        let elapsed = max(0, date.timeIntervalSince(receivedAt))
        let left = max(0, remaining - max(0, elapsed - opensAfter))
        return (elapsed >= revealsAfter, elapsed >= opensAfter && left > 0, Int(ceil(left)))
    }
}
