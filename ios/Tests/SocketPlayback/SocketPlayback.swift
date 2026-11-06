// Runs the actual native receiver without Firebase/UI or a network transport.
import Foundation

@MainActor final class AuthManager {
    func getIdToken() async -> String? { nil }
}
enum StoreCaptureConfiguration { static let enabled = true }

@main struct SocketPlayback {
    @MainActor static func main() throws {
        let game = GameSocket()
        func receive(_ object: [String: Any]) throws {
            game.handle(try JSONSerialization.data(withJSONObject: object))
        }
        func check(_ condition: Bool, _ message: String) {
            precondition(condition, message)
            print("PASS " + message)
        }
        try receive(["type":"identified", "profile":["id":"alice", "name":"Alice", "avatar":"fox"]])
        check(game.clientId == "alice" && game.name == "Alice" && game.avatar == "fox", "Canonical server identity")
        try receive(["type":"game_start", "totalRounds":6, "opponents":[["id":"old", "clientId":"bob", "name":"Bob", "avatar":"owl"]]])
        check(game.opponents.count == 1 && game.opponents[0].score == 0, "Game start without score defaults")
        game.isStarting = true
        try receive(["type":"game_reconnected", "score":34, "totalRounds":6, "opponents":[["id":"new", "name":"Bob", "avatar":"owl", "score":28, "answered":true]]])
        check(!game.isStarting && game.score == 34 && game.opponents[0].id == "new" && game.opponents[0].score == 28, "Recovered game restores scores and clears start lock")
        let question: [String: Any] = ["type":"question", "round":3, "totalRounds":6, "question":"Question", "category":"Science", "icon":"", "answers":["A","B","C","D"], "timeLimit":10, "isBonus":false, "readingMs":1500, "answerOpensInMs":2050, "remainingMs":10000]
        try receive(question)
        check(!game.answersVisible && !game.answerInputOpen && game.timeLeft == 10, "Question appears before answers without spending answer time")
        var recovered = question
        recovered.merge(["reconnect":true, "answered":true, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "readingMs":0, "answerOpensInMs":0, "remainingMs":4300]) { _, new in new }
        try receive(recovered)
        check(game.answerAccepted && game.selectedAnswer == 1 && !game.answerInputOpen && game.opponents[0].answered, "Recovered answer remains locked and opponent state survives")
        try receive(["type":"round_result", "round":3, "correctIndex":1, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "yourScore":52, "others":[["id":"new", "answered":true, "correct":true, "score":45]]])
        check(game.score == 52 && game.opponents[0].score == 45 && game.reveal?.correctIndex == 1, "Reveal advances both authoritative score rails")
        game.isStarting = true
        try receive(["type":"already_playing"])
        check(!game.isStarting && game.stage == .question, "Duplicate start rejection preserves recovered duel")
        game.profileSaving = true
        try receive(["type":"rate_limited"])
        check(!game.profileSaving && game.stage == .question && game.socialError != nil, "Rate limiting remains recoverable")
        let message: [String: Any] = ["id":"m1", "fromId":"alice", "toId":"bob", "kind":"text", "text":"On joue ?", "createdAt":1793920000000, "clientMessageId":"draft1"]
        game.pendingMessageID = "draft1"
        try receive(["type":"dm_sent", "message":message])
        check(game.pendingMessageID == nil && game.lastSentMessageID == "draft1" && game.messages["bob"]?.count == 1, "Only server acknowledgement confirms a sent message")
        try receive(["type":"dm_sent", "message":message])
        check(game.messages["bob"]?.count == 1, "Repeated message acknowledgement is idempotent")
        try receive(["type":"dm", "message":["id":"broken"]])
        check(game.messages["bob"]?.count == 1, "Malformed message cannot erase a conversation")
        let earlier: [String: Any] = ["id":"m0", "fromId":"bob", "toId":"alice", "kind":"text", "text":"Salut", "createdAt":1793919999000]
        try receive(["type":"dm_history", "targetId":"bob", "messages":[earlier], "hasMore":true])
        check(game.messages["bob"]?.map(\.id) == ["m0", "m1"] && game.historyHasMore["bob"] == true, "Earlier history merges without discarding newer confirmed messages")
        game.conversationOpen = true; game.activeConversation = "bob"
        game.resetForSignOut()
        check(game.stage == .authGate && game.clientId == nil && game.messages.isEmpty && game.activeConversation == nil && !game.conversationOpen, "Sign out clears account and conversation state")
        print("Verified 13 native receiver contracts with no live network or identity provider")
    }
}
