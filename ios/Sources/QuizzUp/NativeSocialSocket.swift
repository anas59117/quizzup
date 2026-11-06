import Foundation

@MainActor
extension GameSocket {
    func updateStats(_ raw: [String: Any]) {
        stats = decode(raw, as: PlayerStats.self) ?? stats
        topicProgress = decode(raw["topics"], as: [NativeTopicProgress].self) ?? []
        followedThemes = raw["followedThemes"] as? [String] ?? []
    }

    func handleSocial(_ type: String, object: [String: Any]) -> Bool {
        switch type {
        case "stats": if let raw = object["stats"] as? [String: Any] { updateStats(raw) }
        case "profile_updated":
            if let raw = object["profile"] as? [String: Any] {
                name = raw["name"] as? String ?? name; avatar = raw["avatar"] as? String ?? avatar
                persistIdentity(); profileSaving = false
                if stage == .join { stage = .home }
            }
        case "profile_update_failed": profileSaving = false; socialError = t("serverUnreachable")
        case "friends_list": friends = decode(object["friends"], as: [NativeFriend].self) ?? []
        case "friend_requests": friendRequests = decode(object["requests"], as: [NativeFriend].self) ?? []
        case "friend_request_received":
            if let friend = decode(object["from"], as: NativeFriend.self), !friendRequests.contains(where: { $0.id == friend.id }) { friendRequests.append(friend) }
        case "friend_request_sent": socialNotice = lang == "fr" ? "Demande d’ami envoyée." : "Friend request sent."
        case "friend_request_rejected": socialError = lang == "fr" ? "Cette demande n’a pas pu être envoyée. Vérifie le code de ton ami." : "This request could not be sent. Check your friend's code."
        case "friend_added":
            if let friend = decode(object["friend"], as: NativeFriend.self) {
                if !friends.contains(where: { $0.id == friend.id }) { friends.append(friend) }
                friendRequests.removeAll { $0.id == friend.id }
            }
        case "friend_declined": friendRequests.removeAll { $0.id == object["id"] as? String }
        case "friend_removed":
            if let id = object["id"] as? String {
                friends.removeAll { $0.id == id }; conversations.removeAll { $0.id == id }; messages.removeValue(forKey: id)
            }
        case "presence":
            if let id = object["id"] as? String, let index = friends.firstIndex(where: { $0.id == id }) { friends[index].online = object["online"] as? Bool }
        case "conversations_list":
            conversations = decode(object["conversations"], as: [NativeConversation].self) ?? []
            inboxLoading = false
        case "dm_history":
            if let target = object["targetId"] as? String {
                mergeMessages(decode(object["messages"], as: [NativeMessage].self) ?? [], peer: target)
                _ = send(["type": "dm_read", "targetId": target])
            }
            historyLoading = false
        case "dm_read":
            if let index = conversations.firstIndex(where: { $0.id == object["targetId"] as? String }) { conversations[index].unread = 0 }
        case "dm", "dm_sent":
            if let message = decode(object["message"], as: NativeMessage.self) {
                let peer = message.fromId == clientId ? message.toId : message.fromId
                mergeMessages([message], peer: peer)
                if type == "dm", peer == activeConversation { _ = send(["type": "dm_read", "targetId": peer]) }
                if let acknowledgement = message.clientMessageId, type == "dm_sent" {
                    lastSentMessageID = acknowledgement
                    if acknowledgement == pendingMessageID { pendingMessageID = nil }
                }
                _ = send(["type": "conversations_list"])
            }
        case "challenge_updated":
            if let challenge = decode(object["challenge"], as: NativeChallenge.self) {
                for peer in Array(messages.keys) {
                    messages[peer] = messages[peer]?.map { message in
                        var updated = message
                        if updated.challenge?.id == challenge.id { updated.challenge = challenge }
                        return updated
                    }
                }
            }
        case "social_error", "dm_unavailable", "rate_limited":
            inboxLoading = false; historyLoading = false; pendingMessageID = nil
            if type == "rate_limited" { profileSaving = false }
            socialError = lang == "fr" ? "L’action n’a pas abouti. Vérifie ta connexion et réessaie." : "The action could not be completed. Check your connection and retry."
        default: return false
        }
        return true
    }

    private func mergeMessages(_ incoming: [NativeMessage], peer: String) {
        var byID = Dictionary(uniqueKeysWithValues: (messages[peer] ?? []).map { ($0.id, $0) })
        for message in incoming { byID[message.id] = message }
        messages[peer] = Array(byID.values.sorted { $0.createdAt == $1.createdAt ? $0.id < $1.id : $0.createdAt < $1.createdAt }.suffix(500))
    }

    func requestInbox() {
        socialError = nil
        inboxLoading = send(["type": "conversations_list"])
        if !connected { requestProfile() }
    }
    func openConversation(_ peer: String) {
        activeConversation = peer
        socialError = nil
        historyLoading = send(["type": "dm_history", "targetId": peer])
        if !connected { requestProfile() }
    }
    @discardableResult
    func sendMessage(to peer: String, text: String, clientMessageID: String? = nil) -> String? {
        let clean = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(300))
        guard pendingMessageID == nil, !clean.isEmpty else { return nil }
        let id = clientMessageID ?? UUID().uuidString
        guard send(["type": "dm", "targetId": peer, "text": clean, "clientMessageId": id]) else { return nil }
        pendingMessageID = id; socialError = nil
        let attempt = UUID()
        messageAttempt = attempt
        Task {
            try? await Task.sleep(nanoseconds: 15_000_000_000)
            if messageAttempt == attempt, pendingMessageID == id {
                pendingMessageID = nil
                socialError = lang == "fr" ? "L’envoi n’est pas encore confirmé. Ton message est conservé ; tu peux réessayer." : "Delivery is not confirmed yet. Your draft is preserved; you can retry."
            }
        }
        return id
    }
    func addFriend(_ id: String) {
        socialError = nil; socialNotice = nil
        let key = id.trimmingCharacters(in: .whitespacesAndNewlines)
        if !key.isEmpty { _ = send(["type": "friend_request", "targetId": key]) }
    }
    func respondToFriend(_ id: String, accept: Bool) { _ = send(["type": accept ? "friend_accept" : "friend_decline", "requesterId": id]) }
    func challengeFriend(_ id: String, category: String) { _ = send(["type": "challenge_create", "targetId": id, "category": category, "mode": "live"]) }
    func respondToChallenge(_ id: String, accept: Bool) { _ = send(["type": "challenge_respond", "challengeId": id, "accept": accept]) }
}
