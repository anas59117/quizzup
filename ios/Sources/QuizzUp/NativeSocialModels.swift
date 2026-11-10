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
    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }
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
    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }
}

struct NativeCommunityState {
    var filter = NativeCommunityFilter()
    var posts: [NativeCommunityPost] = []
    var latestPost: NativeCommunityPost?
    var replies: [String: [NativeCommunityReply]] = [:]
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
    }
}
