import Foundation

struct NativeTopicProgress: Codable, Identifiable {
    let key: String
    let level: Int
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
