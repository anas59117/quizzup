import Foundation

@MainActor
extension GameSocket {
    func updateStats(_ raw: [String: Any]) {
        stats = decode(raw, as: PlayerStats.self) ?? stats
        topicProgress = decode(raw["topics"], as: [NativeTopicProgress].self) ?? []
        followedThemes = raw["followedThemes"] as? [String] ?? []
    }

    func handleSocial(_ type: String, object: [String: Any]) -> Bool {
        if handleCommunity(type, object: object) { return true }
        switch type {
        case "stats":
            if let raw = object["stats"] as? [String: Any] {
                updateStats(raw)
                restoreSessionAfterStats()
            }
        case "profile_updated":
            if let raw = object["profile"] as? [String: Any] {
                name = raw["name"] as? String ?? name; avatar = raw["avatar"] as? String ?? avatar
                persistIdentity(); profileSaving = false
                if stage == .join { markProfileComplete(); stage = .home }
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
        case "friend_profile_updated":
            if let friend = decode(object["profile"], as: NativeFriend.self),
               let index = friends.firstIndex(where: { $0.id == friend.id }) { friends[index] = friend }
        case "conversations_list":
            conversations = decode(object["conversations"], as: [NativeConversation].self) ?? []
            inboxLoading = false
        case "dm_history":
            if let target = object["targetId"] as? String {
                mergeMessages(decode(object["messages"], as: [NativeMessage].self) ?? [], peer: target)
                historyHasMore[target] = object["hasMore"] as? Bool ?? false
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
    func loadEarlierMessages(_ peer: String) {
        guard !historyLoading, historyHasMore[peer] == true, let first = messages[peer]?.first else { return }
        historyLoading = send(["type": "dm_history", "targetId": peer, "before": first.id])
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

@MainActor
extension GameSocket {
    private var communityUnavailable: String {
        lang == "fr" ? "Connexion indisponible. Réessaie." : "Connection unavailable. Try again."
    }

    func requestCommunity(_ filter: NativeCommunityFilter) {
        if community.filter != filter { community.posts = [] }
        community.filter = filter
        community.error = nil
        guard !StoreCaptureConfiguration.enabled else { return }
        guard connected else { requestProfile(); return }
        var request: [String: Any] = ["type": "feed_list", "scope": filter.following ? "following" : "all"]
        if let category = filter.category { request["category"] = category }
        community.loading = send(request)
        let attempt = UUID()
        community.listAttempt = attempt
        Task {
            try? await Task.sleep(nanoseconds: 12_000_000_000)
            guard community.loading, community.listAttempt == attempt else { return }
            community.loading = false
            community.error = communityUnavailable
        }
    }

    @discardableResult
    func saveNativeProfile(name: String, avatar: String) -> Bool {
        guard !profileSaving else { return false }
        socialError = nil
        guard send(["type": "profile_update", "name": name, "avatar": avatar]) else {
            socialError = t("serverUnreachable")
            return false
        }
        profileSaving = true
        return true
    }

    func publishCommunityPost(category: String, text: String, mediaURL: String?, question: [String: Any]?) {
        guard !community.publishing else { return }
        let draft = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(240))
        guard !draft.isEmpty else { return }
        var payload: [String: Any] = ["type": "post_create", "category": category, "text": draft]
        if let mediaURL { payload["mediaUrl"] = mediaURL }
        if let question { payload["question"] = question }
        guard sendCommunity(payload) else { return }
        community.publishing = true
        let attempt = UUID()
        community.postAttempt = attempt
        Task {
            try? await Task.sleep(nanoseconds: 12_000_000_000)
            guard community.publishing, community.postAttempt == attempt else { return }
            community.publishing = false
            community.error = lang == "fr" ? "Publication non confirmée. Ton brouillon est conservé." : "Publishing was not confirmed. Your draft is preserved."
        }
    }

    func replyToCommunityPost(_ postID: String, text: String) {
        let draft = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(300))
        guard !draft.isEmpty, community.pendingReply == nil,
              sendCommunity(["type": "post_comment", "postId": postID, "text": draft]) else { return }
        community.pendingReply = postID
        let attempt = UUID()
        community.replyAttempt = attempt
        Task {
            try? await Task.sleep(nanoseconds: 12_000_000_000)
            guard community.pendingReply == postID, community.replyAttempt == attempt else { return }
            community.pendingReply = nil
            community.error = communityUnavailable
        }
    }

    @discardableResult
    func sendCommunity(_ payload: [String: Any]) -> Bool {
        community.error = nil
        if send(payload) { return true }
        community.error = communityUnavailable
        return false
    }

    func handleCommunity(_ type: String, object: [String: Any]) -> Bool {
        switch type {
        case "feed_list":
            guard let posts = decode(object["posts"], as: [NativeCommunityPost].self) else {
                community.loading = false
                community.error = communityUnavailable
                return true
            }
            let filter = NativeCommunityFilter(following: object["scope"] as? String == "following", category: object["category"] as? String)
            community.receiveFeed(posts, filter: filter)
        case "post_created":
            guard let post = decode(object["post"], as: NativeCommunityPost.self),
                  post.authorId.map({ !community.hiddenAuthors.contains($0) }) ?? true else { return true }
            if community.publishing, post.authorId == clientId {
                community.lastPublishedID = post.id
                community.publishing = false
            }
            community.latestPost = post
            if !community.filter.following, community.filter.category == nil || community.filter.category == post.category,
               !community.posts.contains(where: { $0.id == post.id }) {
                community.posts.insert(post, at: 0)
            }
        case "post_reacted":
            guard let id = object["id"] as? String, let count = object["reactions"] as? Int else { return true }
            let own = object["actorId"] as? String == clientId
            let reacted = object["reacted"] as? Bool ?? false
            updateCommunityPost(id) { post in
                post.reactions = count
                if own { post.reacted = reacted }
            }
        case "post_comments":
            if let id = object["postId"] as? String,
               let replies = decode(object["comments"], as: [NativeCommunityReply].self) { community.replies[id] = replies }
        case "post_commented":
            guard let id = object["postId"] as? String,
                  let reply = decode(object["comment"], as: NativeCommunityReply.self) else { return true }
            var replies = community.replies[id] ?? []
            if !replies.contains(where: { $0.id == reply.id }) { replies.append(reply) }
            community.replies[id] = Array(replies.suffix(100))
            if reply.authorId == clientId, community.pendingReply == id {
                community.lastReplyID = reply.id
                community.pendingReply = nil
            }
            if let count = object["commentsCount"] as? Int { updateCommunityPost(id) { $0.commentsCount = count } }
        case "post_question_result":
            if let answer = decode(object, as: NativeCommunityAnswer.self) { community.answers[answer.postId] = answer }
        case "post_report_ack":
            if let id = object["id"] as? String { community.reported.insert(id) }
        case "post_hidden":
            if let id = object["id"] as? String {
                community.posts.removeAll { $0.id == id }
                if community.latestPost?.id == id { community.latestPost = nil }
            }
        case "follow_updated":
            guard let id = object["targetId"] as? String, let following = object["isFollowing"] as? Bool else { return true }
            if let counts = object["mine"] as? [String: Any], let count = counts["following"] as? Int { stats?.following = count }
            for index in community.posts.indices where community.posts[index].authorId == id { community.posts[index].authorFollowed = following }
            if !following, community.filter.following { community.posts.removeAll { $0.authorId == id } }
            if object["reason"] as? String == "blocked" { community.error = communityUnavailable }
        case "community_error":
            let action = object["action"] as? String
            if action == "post_create" { community.publishing = false }
            if action == "post_comment" { community.pendingReply = nil }
            community.error = lang == "fr" ? "Cette action a échoué. Réessaie." : "This action failed. Try again."
        case "rate_limited":
            guard let code = object["code"] as? String,
                  ["FEED_RATE_LIMITED", "POST_RATE_LIMITED", "REACTION_RATE_LIMITED", "REPORT_RATE_LIMITED", "FOLLOW_RATE_LIMITED"].contains(code) else { return false }
            if code == "FEED_RATE_LIMITED" { community.loading = false }
            if code == "POST_RATE_LIMITED" { community.publishing = false }
            community.error = lang == "fr" ? "Patiente un instant puis réessaie." : "Wait a moment and try again."
        default: return false
        }
        return true
    }

    private func updateCommunityPost(_ id: String, _ update: (inout NativeCommunityPost) -> Void) {
        if let index = community.posts.firstIndex(where: { $0.id == id }) { update(&community.posts[index]) }
        if var latest = community.latestPost, latest.id == id {
            update(&latest)
            community.latestPost = latest
        }
    }
}
