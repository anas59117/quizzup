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
        let returningID = "restore-test-\(UUID().uuidString)"
        let newID = "setup-test-\(UUID().uuidString)"
        defer {
            UserDefaults.standard.removeObject(forKey: "quizzup.profileComplete.\(returningID)")
            UserDefaults.standard.removeObject(forKey: "quizzup.profileComplete.\(newID)")
        }
        let restore = GameSocket()
        restore.identify(idToken: "capture-fixture", authManager: AuthManager())
        restore.handle(try JSONSerialization.data(withJSONObject: ["type":"identified", "profile":["id":returningID, "name":"Alice", "avatar":"fox"]]))
        check(restore.stage == .authGate, "Restore waits for authoritative account statistics")
        let playedStats: [String: Any] = ["games":2, "wins":1, "streak":0, "xp":357, "level":2, "xpIntoLevel":157, "xpForLevel":200]
        restore.handle(try JSONSerialization.data(withJSONObject: ["type":"stats", "stats":playedStats]))
        check(restore.stage == .home && !restore.restoringSession, "Existing player resumes directly at home")
        let fresh = GameSocket()
        fresh.identify(idToken: "capture-fixture", authManager: AuthManager())
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"identified", "profile":["id":newID, "name":"Player123", "avatar":"robot"]]))
        var emptyStats = playedStats
        emptyStats["games"] = 0
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"stats", "stats":emptyStats]))
        check(fresh.stage == .join, "A different new account still gets its own profile setup")
        fresh.restoringSession = false
        fresh.stage = .error
        fresh.retryConnection()
        check(fresh.stage == .authGate, "Retry after an incomplete setup returns to account restoration")
        fresh.identify(idToken: "capture-fixture", authManager: AuthManager())
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"stats", "stats":emptyStats]))
        check(fresh.stage == .join, "Retried new account still requires confirmed profile setup")
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"profile_updated", "profile":["id":newID, "name":"Sam", "avatar":"owl"]]))
        check(fresh.stage == .home, "Only acknowledged profile completion opens home")
        fresh.stage = .authGate
        fresh.restoringSession = true
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"stats", "stats":emptyStats]))
        check(fresh.stage == .home, "An account with a completed profile resumes even before its first game")
        fresh.stage = .question
        fresh.restoringSession = true
        fresh.handle(try JSONSerialization.data(withJSONObject: ["type":"stats", "stats":playedStats]))
        check(fresh.stage == .question && !fresh.restoringSession, "Restored account statistics cannot replace a recovered active duel")
        try receive(["type":"identified", "profile":["id":"alice", "name":"Alice", "avatar":"fox"]])
        check(game.clientId == "alice" && game.name == "Alice" && game.avatar == "fox", "Canonical server identity")
        game.roomScreenOpen = true
        game.roomPending = true
        let room: [String: Any] = ["type":"room_created", "code":"AB234", "players":[["id":"self", "name":"Alice", "avatar":"fox", "connected":true]], "isHost":true, "canStart":false]
        try receive(room)
        check(!game.roomPending && game.privateRoom?.code == "AB234" && game.privateRoom?.canStart == false, "Only a confirmed room is presented, with the server’s launch eligibility")
        try receive(["type":"room_closed"])
        check(game.privateRoom == nil && game.roomError != nil, "Remote room closure clears the lobby and displays a recovery message")
        try receive(["type":"leaderboard_list", "category":"science", "entries":[["id":"alice", "rank":1, "name":"Alice", "avatar":"fox", "xp":84]]])
        check(game.topicLeaderboards["science"]?.first?.score == 84, "The category ranking uses authoritative topic XP")
        try receive(["type":"game_start", "totalRounds":6, "opponents":[["id":"old", "clientId":"bob", "name":"Bob", "avatar":"owl"]]])
        check(game.opponents.count == 1 && game.opponents[0].score == 0, "Game start without score defaults")
        game.isStarting = true
        try receive(["type":"game_reconnected", "score":34, "totalRounds":6, "opponents":[["id":"new", "name":"Bob", "avatar":"owl", "score":28, "answered":true]]])
        check(!game.isStarting && game.score == 34 && game.opponents[0].id == "new" && game.opponents[0].score == 28, "Recovered game restores scores and clears start lock")
        let question: [String: Any] = ["type":"question", "round":3, "totalRounds":6, "question":"Question", "category":"Science", "icon":"", "answers":["A","B","C","D"], "timeLimit":10, "isBonus":false, "readingMs":1500, "answerOpensInMs":2050, "remainingMs":10000]
        try receive(question)
        check(!game.answersVisible && !game.answerInputOpen && game.timeLeft == 10, "Question appears before answers without spending answer time")
        check(!game.opponents[0].answered, "A new round resets the previous opponent answer")
        try receive(["type":"opponent_answered", "id":"new"])
        var answering = question
        answering.merge(["readingMs":0, "answerOpensInMs":0, "remainingMs":6000]) { _, new in new }
        try receive(answering)
        try receive(["type":"answer_ack", "round":3, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "yourScore":52])
        let acceptedClock = game.timeLeft
        game.refreshRoundClock(at: Date().addingTimeInterval(1.25))
        check(game.timeLeft > 0 && game.timeLeft < acceptedClock && game.answerAccepted && !game.answerInputOpen,
              "Accepted answer stays locked while the shared opponent deadline keeps counting down")
        try receive(["type":"opponent_answered", "id":"new"])
        var recovered = question
        recovered.merge(["reconnect":true, "answered":true, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "readingMs":0, "answerOpensInMs":0, "remainingMs":4300]) { _, new in new }
        try receive(recovered)
        check(game.answerAccepted && game.selectedAnswer == 1 && !game.answerInputOpen && game.opponents[0].answered, "Recovered answer remains locked and opponent state survives")
        let recoveredClock = game.timeLeft
        game.refreshRoundClock(at: Date().addingTimeInterval(1.25))
        check(game.timeLeft > 0 && game.timeLeft < recoveredClock && !game.answerInputOpen,
              "Recovered accepted answer resumes the server remaining time without reopening input")
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
        print("Verified native receiver contracts with no live network or identity provider")
    }
}
