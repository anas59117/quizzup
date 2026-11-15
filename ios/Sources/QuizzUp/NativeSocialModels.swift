import Foundation

struct NativeTopicProgress: Codable, Identifiable {
    let key: String
    let level: Int
    var completion: Int?
    var bestStreak: Int?
    var id: String { key }
}

struct NativeFriend: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let avatar: String
    var online: Bool?
}

struct NativeChallenge: Codable {
    let id: String
    let fromId: String
    let toId: String
    let category: String
    var status: String
    var mode: String?
}

struct NativeMessage: Codable, Identifiable {
    let id: String
    let fromId: String
    let toId: String
    let kind: String
    let text: String
    let createdAt: Double
    var challenge: NativeChallenge?
    var clientMessageId: String?
    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }
}

struct NativeConversation: Codable, Identifiable {
    let peer: NativeFriend
    let lastMessage: NativeMessage
    var unread: Int
    var id: String { peer.id }
}

struct NativeCommunityFilter: Equatable {
    var following = false
    var category: String?
    var topicsOnly = false
    var categories: [String] = []
    var mine = false

    var scope: String { mine ? "mine" : topicsOnly ? "topics" : following ? "following" : "all" }

    func includesLivePost(_ post: NativeCommunityPost, clientID: String?) -> Bool {
        guard !following, !mine || (clientID != nil && post.authorId == clientID) else { return false }
        guard category == nil || category == post.category else { return false }
        return !topicsOnly || post.category.map { categories.contains($0) } == true
    }
}

struct NativeCommunityPost: Decodable, Identifiable {
    let id: String
    let authorId: String?
    let authorName: String
    let authorAvatar: String
    var authorFollowed: Bool
    let category: String?
    let text: String
    let mediaUrl: String?
    let question: NativeCommunityQuestion?
    var reactions: Int
    var reacted: Bool
    var commentsCount: Int
    let createdAt: Double
    var isDemo: Bool? = nil
    var isOfficial: Bool? = nil
    var demoAvatar: String? = nil
    var lastComment: NativeCommunityReply? = nil
    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }
    var displayAvatar: String {
        guard isDemo == true, let demoAvatar, let url = URL(string: demoAvatar),
              url.scheme == "https", url.host != nil, url.user == nil, url.password == nil else { return authorAvatar }
        return demoAvatar
    }
}

struct NativeCommunityQuestion: Decodable {
    let prompt: String
    let answers: [String]
}

struct NativeCommunityAnswer: Decodable {
    let postId: String
    let answerIndex: Int
    let correctIndex: Int
}

struct NativeCommunityReply: Decodable, Identifiable {
    let id: String
    let authorId: String
    let authorName: String
    let authorAvatar: String
    let text: String
    let createdAt: Double
    var parentId: String? = nil
    var reactions: Int = 0
    var reacted: Bool = false
    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }

    enum CodingKeys: String, CodingKey {
        case id, authorId, authorName, authorAvatar, text, createdAt, parentId, reactions, reacted
    }
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        id = try values.decode(String.self, forKey: .id)
        authorId = try values.decode(String.self, forKey: .authorId)
        authorName = try values.decode(String.self, forKey: .authorName)
        authorAvatar = try values.decode(String.self, forKey: .authorAvatar)
        text = try values.decode(String.self, forKey: .text)
        createdAt = try values.decode(Double.self, forKey: .createdAt)
        parentId = try values.decodeIfPresent(String.self, forKey: .parentId)
        reactions = try values.decodeIfPresent(Int.self, forKey: .reactions) ?? 0
        reacted = try values.decodeIfPresent(Bool.self, forKey: .reacted) ?? false
    }

    init(id: String, authorId: String, authorName: String, authorAvatar: String, text: String,
         createdAt: Double, parentId: String? = nil, reactions: Int = 0, reacted: Bool = false) {
        self.id = id; self.authorId = authorId; self.authorName = authorName; self.authorAvatar = authorAvatar
        self.text = text; self.createdAt = createdAt; self.parentId = parentId
        self.reactions = reactions; self.reacted = reacted
    }
}

struct NativeCommunityState {
    var filter = NativeCommunityFilter()
    var posts: [NativeCommunityPost] = []
    var latestPost: NativeCommunityPost?
    var replies: [String: [NativeCommunityReply]] = [:]
    var loadedReplyPosts: Set<String> = []
    var answers: [String: NativeCommunityAnswer] = [:]
    var reported: Set<String> = []
    var hiddenAuthors: Set<String> = []
    var pendingReply: String?
    var lastReplyID: String?
    var lastPublishedID: String?
    var loading = false
    var publishing = false
    var error: String?
    var listAttempt = UUID()
    var postAttempt = UUID()
    var replyAttempt = UUID()
    var pendingReactions: Set<String> = []
    var pendingCommentReactions: Set<String> = []
    var reactionAttempts: [String: UUID] = [:]
    var commentReactionAttempts: [String: UUID] = [:]

    mutating func receiveComment(_ reply: NativeCommunityReply, postID: String, count: Int?, removedCommentIDs: [String]? = nil) {
        let removed = Set(removedCommentIDs ?? [])
        var comments = (replies[postID] ?? []).filter {
            !removed.contains($0.id) && !removed.contains($0.parentId ?? "")
        }
        if !comments.contains(where: { $0.id == reply.id }) { comments.append(reply) }
        replies[postID] = Array(comments.suffix(100))
        for index in posts.indices where posts[index].id == postID {
            if let count { posts[index].commentsCount = count }
            posts[index].lastComment = reply
        }
        if var latest = latestPost, latest.id == postID {
            if let count { latest.commentsCount = count }
            latest.lastComment = reply
            latestPost = latest
        }
    }

    mutating func receiveCommentReaction(postID: String, commentID: String, count: Int, reacted: Bool, own: Bool) {
        func update(_ reply: inout NativeCommunityReply) {
            guard reply.id == commentID else { return }
            reply.reactions = count
            if own { reply.reacted = reacted }
        }
        if var list = replies[postID] {
            for index in list.indices { update(&list[index]) }
            replies[postID] = list
        }
        for index in posts.indices where posts[index].id == postID {
            if var preview = posts[index].lastComment { update(&preview); posts[index].lastComment = preview }
        }
        if var latest = latestPost, latest.id == postID, var preview = latest.lastComment {
            update(&preview); latest.lastComment = preview; latestPost = latest
        }
        if own { pendingCommentReactions.remove(commentID); commentReactionAttempts.removeValue(forKey: commentID) }
    }

    mutating func receiveFeed(_ incoming: [NativeCommunityPost], filter receivedFilter: NativeCommunityFilter) {
        let visible = incoming.filter { post in post.authorId.map { !hiddenAuthors.contains($0) } ?? true }
        if receivedFilter == NativeCommunityFilter() { latestPost = visible.first }
        guard filter == receivedFilter else { return }
        posts = visible
        loading = false
    }

    mutating func hideAuthor(_ id: String) {
        hiddenAuthors.insert(id)
        posts.removeAll { $0.authorId == id }
        if latestPost?.authorId == id { latestPost = nil }
        var hiddenCommentIDs: Set<String> = []
        for key in Array(replies.keys) {
            let comments = replies[key] ?? []
            let hiddenRoots = Set(comments.filter { $0.authorId == id && $0.parentId == nil }.map(\.id))
            let hidden = comments.filter { $0.authorId == id || hiddenRoots.contains($0.parentId ?? "") }
            hiddenCommentIDs.formUnion(hidden.map(\.id))
            replies[key] = comments.filter { !hiddenCommentIDs.contains($0.id) }
        }
        for index in posts.indices {
            if let preview = posts[index].lastComment, preview.authorId == id || hiddenCommentIDs.contains(preview.id) {
                posts[index].lastComment = nil
            }
        }
        if let preview = latestPost?.lastComment, preview.authorId == id || hiddenCommentIDs.contains(preview.id) {
            latestPost?.lastComment = nil
        }
    }
}
