import Foundation

// Mirrors backend/questions.js's listCategories() shape, fetched over
// HTTPS from /categories so the app never needs its own hardcoded list.
struct Category: Codable, Identifiable, Hashable {
    let key: String
    let label: String
    let icon: String
    let count: Int
    var id: String { key }
}

// Custom Decodable: game_start's `opponents` only ever sends
// {id, name, avatar, clientId} (see game.js:74) — score/answered/correct
// arrive later via round_result/game_end. Swift's synthesized Decodable
// does NOT fall back to a property's default value for a missing key (only
// Optional properties tolerate an absent key), so without this the whole
// array would fail to decode and silently become empty for every match.
struct Opponent: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let avatar: String
    var clientId: String?
    var score: Int = 0
    var answered: Bool = false
    var correct: Bool = false

    enum CodingKeys: String, CodingKey { case id, name, avatar, clientId, score, answered, correct }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        avatar = try c.decode(String.self, forKey: .avatar)
        clientId = try c.decodeIfPresent(String.self, forKey: .clientId)
        score = try c.decodeIfPresent(Int.self, forKey: .score) ?? 0
        answered = try c.decodeIfPresent(Bool.self, forKey: .answered) ?? false
        correct = try c.decodeIfPresent(Bool.self, forKey: .correct) ?? false
    }

    init(id: String, name: String, avatar: String, clientId: String? = nil, score: Int = 0, answered: Bool = false, correct: Bool = false) {
        self.id = id; self.name = name; self.avatar = avatar; self.clientId = clientId
        self.score = score; self.answered = answered; self.correct = correct
    }
}

struct RoundIntro: Codable {
    let round: Int
    let totalRounds: Int
    let category: String
    let icon: String
    let isBonus: Bool
}

// game.js's 'question' message — `question` is the prompt text (kept
// under that key to match the backend, not renamed to `text`).
struct Question: Codable {
    let round: Int
    let totalRounds: Int
    let question: String
    let category: String
    let icon: String
    let answers: [String]
    let timeLimit: Int
    let isBonus: Bool
    let image: String?
    let credit: String?
}

struct OtherRoundUpdate: Codable, Hashable {
    let id: String
    let answered: Bool
    let correct: Bool
}

struct RoundResult: Codable {
    let round: Int
    let correctIndex: Int
    let yourAnswer: Int?
    let yourCorrect: Bool
    let pointsEarned: Int
    let yourScore: Int
    let others: [OtherRoundUpdate]
}

struct XpBreakdown: Codable {
    let matchScore: Int
    let finishBonus: Int
    let winBonus: Int
    let xpTotal: Int
}

struct PlayerStats: Codable {
    let games: Int
    let wins: Int
    let streak: Int
    let xp: Int
    let level: Int
    let xpIntoLevel: Int
    let xpForLevel: Int
}

struct GameEnd: Codable {
    let finalScore: Int
    let won: Bool
    let tie: Bool
    let others: [OpponentFinal]
    let leaderboard: [LeaderboardRow]
    let reason: String
    let coins: Int
    let xp: Int
    let xpBreakdown: XpBreakdown
    let stats: PlayerStats?
}

struct OpponentFinal: Codable, Hashable {
    let id: String
    let name: String
    let avatar: String
    let score: Int
    var clientId: String?
}

struct LeaderboardRow: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let avatar: String
    let score: Int
}
