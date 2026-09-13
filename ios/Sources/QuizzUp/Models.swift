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

struct Opponent: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let avatar: String
    var clientId: String?
    var score: Int = 0
    var answered: Bool = false
    var correct: Bool = false
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
