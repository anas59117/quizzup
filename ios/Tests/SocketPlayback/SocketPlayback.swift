// Runs the actual native receiver without Firebase/UI or a network transport.
import Foundation

@MainActor final class AuthManager {
    var deletionResumed = false
    func getIdToken() async -> String? { nil }
    func resumeAccountDeletion() { deletionResumed = true }
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
        let tutor = GameSocket()
        let tutorID = "tutorial-\(UUID().uuidString)"
        let otherID = "tutorial-other-\(UUID().uuidString)"
        let recoveredID = "tutorial-recovered-\(UUID().uuidString)"
        let bypassID = "tutorial-bypass-\(UUID().uuidString)"
        defer {
            for id in [tutorID, otherID, recoveredID, bypassID] {
                UserDefaults.standard.removeObject(forKey: "quizzup.onboardingPending.\(id)")
                UserDefaults.standard.removeObject(forKey: "quizzup.profileComplete.\(id)")
            }
        }
        func tutorReceive(_ object: [String: Any]) throws {
            tutor.handle(try JSONSerialization.data(withJSONObject: object))
        }
        var onboardingWire: [String: Any] = ["version":1, "status":"pending", "rulesSeen":false,
            "communitySeen":false, "progressionSeen":false, "profileComplete":true]
        tutor.identify(idToken: "capture-fixture", authManager: AuthManager())
        try tutorReceive(["type":"identified", "profile":["id":tutorID, "name":"Sam", "avatar":"robot"], "onboarding":onboardingWire])
        try tutorReceive(["type":"stats", "stats":emptyStats])
        check(tutor.stage == .home && tutor.onboarding.showsWelcome,
              "Server-confirmed profile survives reinstall before the first game and invites the new player")
        tutor.queuePlaySheetLaunch(category: "science", solo: true)
        check(tutor.onboardingLaunch == nil && !tutor.isStarting,
              "Selecting a mode only queues intent while the play sheet is dismissing")
        tutor.completePlaySheetDismissal()
        check(tutor.onboardingLaunch?.category == "science" && tutor.onboardingLaunch?.solo == true && !tutor.isStarting,
              "The dismissal callback preserves the chosen solo mode and topic without starting before rules")
        tutor.onboardingLaunch = nil
        tutor.completePlaySheetDismissal()
        check(tutor.onboardingLaunch == nil && !tutor.isStarting,
              "A cancelled or already drained play sheet cannot start a match")
        tutor.startWithCategory("science")
        check(tutor.onboardingLaunch?.category == "science" && !tutor.isStarting && tutor.stage == .home,
              "First chosen duel waits at real mode rules before any matchmaking request")
        tutor.updateOnboarding(.skip)
        check(tutor.onboardingLaunch == nil && !tutor.onboarding.offersContext && tutor.onboarding.server?.status == .pending,
              "Skip immediately exits help while the saved account status still awaits acknowledgement")
        try tutorReceive(["type":"onboarding_update_failed", "clientId":tutorID, "code":"STORAGE_UNAVAILABLE"])
        check(tutor.onboarding.pending.contains(.skip) && tutor.onboardingSyncError != nil,
              "A failed skip remains an unsaved retry intent with an honest error")
        try tutorReceive(["type":"identified", "profile":["id":tutorID, "name":"Sam", "avatar":"robot"], "onboarding":onboardingWire])
        check(tutor.onboarding.pending.contains(.skip) && !tutor.onboarding.showsWelcome,
              "Reconnect retains the same account's unacknowledged skip")
        onboardingWire["profileComplete"] = false
        onboardingWire["status"] = "skipped"
        try tutorReceive(["type":"identified", "profile":["id":otherID, "name":"Player", "avatar":"robot"], "onboarding":onboardingWire])
        tutor.stage = .authGate; tutor.restoringSession = true
        try tutorReceive(["type":"stats", "stats":emptyStats])
        check(tutor.stage == .join && tutor.onboarding.pending.isEmpty,
              "Switching account clears another user's writes, and skipped tutorial cannot bypass a required pseudo")
        var stale = onboardingWire; stale["profileComplete"] = true
        try tutorReceive(["type":"onboarding_updated", "clientId":tutorID, "onboarding":stale])
        check(tutor.onboarding.server?.profileComplete == false,
              "An old account's late onboarding acknowledgement cannot complete this account's profile")
        try tutorReceive(["type":"profile_updated", "profile":["id":otherID, "name":"Sam", "avatar":"robot"], "onboarding":stale])
        check(tutor.stage == .home && tutor.onboarding.server?.profileComplete == true && !tutor.onboarding.offersContext,
              "A skipped account can complete its required pseudo without restarting the tutorial")
        tutor.resetForSignOut()
        check(tutor.onboarding.server == nil && tutor.onboardingLaunch == nil && tutor.onboarding.pending.isEmpty,
              "Sign out removes all presented help and account-bound in-memory intents")
        let recoveredTutorial = GameSocket()
        let endWire: [String: Any] = ["type":"game_end", "finalScore":80, "won":true, "tie":false,
            "others":[], "leaderboard":[], "reason":"complete", "coins":0, "xp":120,
            "xpBreakdown":["matchScore":80, "finishBonus":40, "winBonus":0, "xpTotal":120], "stats":playedStats]
        recoveredTutorial.handle(try JSONSerialization.data(withJSONObject: endWire))
        check(recoveredTutorial.stage == .finished && !recoveredTutorial.onboardingProgressionVisible,
              "A recovered final result waits for this account's onboarding eligibility")
        var recoveredState = onboardingWire
        recoveredState["status"] = "completed"; recoveredState["profileComplete"] = true
        recoveredTutorial.handle(try JSONSerialization.data(withJSONObject: ["type":"identified",
            "profile":["id":recoveredID, "name":"Sam", "avatar":"robot"], "onboarding":recoveredState]))
        check(recoveredTutorial.onboardingProgressionVisible,
              "Identifying after a recovered final result reveals its still-unseen progression explanation")
        let bypassTutorial = GameSocket()
        var pendingState = recoveredState; pendingState["status"] = "pending"
        bypassTutorial.handle(try JSONSerialization.data(withJSONObject: ["type":"identified",
            "profile":["id":bypassID, "name":"Sam", "avatar":"robot"], "onboarding":pendingState]))
        bypassTutorial.handle(try JSONSerialization.data(withJSONObject: ["type":"game_start", "opponents":[], "totalRounds":6]))
        check(!bypassTutorial.onboarding.showsWelcome && bypassTutorial.onboarding.pending.contains(.complete)
              && bypassTutorial.onboarding.server?.status == .pending,
              "Starting a real game without the invitation dismisses the first-quiz welcome while awaiting saved completion")
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
        let feedbackID = game.answerFeedback?.id
        check(game.answerFeedback?.correct == true, "Correct sound is requested only after a confirmed answer")
        try receive(["type":"answer_ack", "round":3, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "yourScore":52])
        check(game.answerFeedback?.id == feedbackID, "Duplicate acknowledgements do not replay answer sounds")
        game.refreshRoundClock(at: Date().addingTimeInterval(9))
        check(game.timeLeft == 0 && !game.answerInputOpen, "The shared deadline expires without reopening a submitted answer")
        try receive(["type":"opponent_answered", "id":"new"])
        var recovered = question
        recovered.merge(["reconnect":true, "answered":true, "yourAnswer":1, "yourCorrect":true, "pointsEarned":18, "readingMs":0, "answerOpensInMs":0, "remainingMs":4300]) { _, new in new }
        try receive(recovered)
        check(game.answerAccepted && game.selectedAnswer == 1 && !game.answerInputOpen && game.opponents[0].answered, "Recovered answer remains locked and opponent state survives")
        check(game.answerFeedback == nil, "A recovered answer does not replay old feedback")
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
        game.profileSaving = true
        try receive(["type":"profile_update_failed", "code":"CONTENT_NOT_ALLOWED"])
        check(!game.profileSaving && game.socialError == game.t("contentNotAllowed"), "Rejected profile content gives an actionable localized error")
        game.community.publishing = true
        try receive(["type":"community_error", "action":"post_create", "code":"CONTENT_NOT_ALLOWED"])
        check(!game.community.publishing && game.community.error == game.t("contentNotAllowed"), "Rejected community content unlocks the preserved draft with a localized error")
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
        let unaffectedAuth = AuthManager()
        game.identify(idToken: "capture-fixture", authManager: unaffectedAuth)
        try receive(answering)
        game.isStarting = true; game.cancelPending = true; game.rematchWaiting = true
        try receive(["type":"match_aborted", "code":"ACCOUNT_DELETED"])
        check(game.stage == .home && game.question == nil && game.roundIntro == nil && game.reveal == nil && game.result == nil,
              "An aborted match returns the unaffected opponent home without stale round or result UI")
        check(!game.isStarting && !game.cancelPending && !game.rematchWaiting && !game.answerInputOpen && !game.recoverGameOnIdentify,
              "An aborted match clears pending match controls and retained recovery")
        check(!unaffectedAuth.deletionResumed && game.clientId == "alice" && game.connected && game.messages["bob"]?.count == 2,
              "Opponent account deletion preserves this player's identity, transport and conversations")
        let abortedClock = game.timeLeft
        game.refreshRoundClock(at: Date().addingTimeInterval(60))
        check(game.timeLeft == abortedClock, "The cancelled round clock cannot update after an aborted match")
        try receive(["type":"game_start", "totalRounds":6, "opponents":[]])
        try receive(answering)
        check(game.stage == .question && game.answerInputOpen && game.recoverGameOnIdentify,
              "The unaffected player can enter a fresh game after cancellation")
        game.conversationOpen = true; game.activeConversation = "bob"
        check(game.recoverGameOnIdentify, "A fresh launch can recover a retained game")
        game.playAgain()
        check(!game.recoverGameOnIdentify, "Leaving results prevents replaying the retained finished game")
        game.disconnect()
        check(!game.recoverGameOnIdentify, "A transport loss preserves intentional result dismissal")
        try receive(["type":"game_reconnected", "score":52, "totalRounds":6, "opponents":[]])
        check(game.recoverGameOnIdentify, "An authoritative active-game recovery restores recovery for its eventual result")
        game.playAgain()
        try receive(["type":"game_start", "totalRounds":6, "opponents":[]])
        check(game.recoverGameOnIdentify, "A newly started game restores active and result recovery")
        game.resetForSignOut()
        check(game.stage == .authGate && game.clientId == nil && game.messages.isEmpty && game.activeConversation == nil && !game.conversationOpen, "Sign out clears account and conversation state")
        let deletingAuth = AuthManager()
        game.identify(idToken: "capture-fixture", authManager: deletingAuth)
        try receive(["type":"auth_required", "code":"ACCOUNT_DELETED"])
        check(deletingAuth.deletionResumed && game.stage == .authGate, "A server deletion tombstone opens identity cleanup instead of retrying gameplay")
        print("Verified native receiver contracts with no live network or identity provider")
    }
}
