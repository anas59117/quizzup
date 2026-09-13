import Foundation
import Combine

enum Stage {
    case join, home, waiting, roundIntro, question, finished, error
}

/// Talks to the same Node.js/WebSocket backend as the web app (backend/server.js).
/// v1 skips the Firebase identify step entirely — the server already treats a
/// connection with no verified clientId as valid for gameplay (see
/// handleIdentify's early return in server.js), so solo/quick-play/categories
/// all work; only clientId-gated features (friends, stats, feed) are out of
/// scope for this native client's first version.
@MainActor
final class GameSocket: ObservableObject {
    // Configure this to your deployed backend. The web app reads the same
    // value from REACT_APP_WS_URL at build time; there's no such thing here,
    // so it's a plain constant — update it if the backend host changes.
    static let backendHost = "quizzup-production.up.railway.app"
    // Player photos (backend/data/*.json's `image` field) are relative paths
    // served as static assets by the web app's own deployment (they live
    // under frontend/public/images/), not by the backend — so they need to
    // be resolved against the frontend's host, not backendHost.
    static let frontendHost = "quizzup-ten.vercel.app"

    static func absoluteImageURL(_ path: String) -> URL? {
        if path.hasPrefix("http") { return URL(string: path) }
        return URL(string: "https://\(frontendHost)\(path)")
    }

    @Published var stage: Stage = .join
    @Published var name: String = UserDefaults.standard.string(forKey: "quizzup.name") ?? ""
    @Published var avatar: String = UserDefaults.standard.string(forKey: "quizzup.avatar") ?? "🐺"
    @Published var soloMode = false
    // True from the moment a join/solo/quick-match request is sent until
    // the server actually answers (waiting, round_intro, or error) — guards
    // against a double-tap firing two start requests before the server's
    // own re-entrancy check (isInActiveGame in server.js) can see the first.
    @Published var isStarting = false
    @Published var categories: [Category] = []
    @Published var lang: String = L10n.detectDefaultLang()

    func t(_ key: String, _ vars: [String: String] = [:]) -> String { L10n.t(key, lang: lang, vars) }
    func toggleLang() {
        lang = lang == "fr" ? "en" : "fr"
        UserDefaults.standard.set(lang, forKey: "quizzup.lang")
    }

    @Published var myId: String?
    @Published var opponents: [Opponent] = []
    @Published var score = 0
    @Published var totalRounds = 6

    @Published var roundIntro: RoundIntro?
    @Published var question: Question?
    @Published var selectedAnswer: Int?
    @Published var reveal: RoundResult?
    @Published var timeLeft = 10

    @Published var result: GameEnd?

    private var task: URLSessionWebSocketTask?
    private var timer: Timer?

    // MARK: - Connection

    private func connect(_ payload: [String: Any]) {
        if task == nil {
            var comps = URLComponents()
            comps.scheme = "wss"
            comps.host = Self.backendHost
            comps.path = "/ws"
            guard let url = comps.url else { return }
            let t = URLSession.shared.webSocketTask(with: url)
            task = t
            t.resume()
            listen()
        }
        send(payload)
    }

    private func send(_ payload: [String: Any]) {
        guard let task, let data = try? JSONSerialization.data(withJSONObject: payload) else { return }
        task.send(.data(data)) { _ in }
    }

    private func listen() {
        task?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .failure:
                // Drop the dead task so a later connect() (e.g. after the
                // user taps "Réessayer") actually opens a new socket instead
                // of silently reusing/sending on this broken one forever.
                Task { @MainActor in self.disconnect(); self.stage = .error }
            case .success(let message):
                if case .data(let data) = message { Task { @MainActor in self.handle(data) } }
                if case .string(let str) = message, let data = str.data(using: .utf8) {
                    Task { @MainActor in self.handle(data) }
                }
                Task { @MainActor in self.listen() }
            }
        }
    }

    private func handle(_ data: Data) {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = obj["type"] as? String else { return }
        let decoder = JSONDecoder()

        switch type {
        case "session":
            myId = obj["playerId"] as? String
        case "waiting":
            stage = .waiting
            isStarting = false
        case "game_start":
            if let arr = obj["opponents"], let d = try? JSONSerialization.data(withJSONObject: arr) {
                opponents = (try? decoder.decode([Opponent].self, from: d)) ?? []
            }
            totalRounds = obj["totalRounds"] as? Int ?? 6
            score = 0
            isStarting = false
            // No stage change here — the server always sends round_intro
            // immediately after game_start, which drives the transition.
        case "round_intro":
            if let intro = try? decoder.decode(RoundIntro.self, from: data) {
                roundIntro = intro
                question = nil
                reveal = nil
                selectedAnswer = nil
                stage = .roundIntro
            }
        case "question":
            if let q = try? decoder.decode(Question.self, from: data) {
                question = q
                selectedAnswer = nil
                reveal = nil
                timeLeft = q.timeLimit
                stage = .question
                startTimer(limit: q.timeLimit)
            }
        case "round_result":
            if let r = try? decoder.decode(RoundResult.self, from: data) {
                reveal = r
                score = r.yourScore
                stopTimer()
            }
        case "game_end":
            if let end = try? decoder.decode(GameEnd.self, from: data) {
                result = end
                score = end.finalScore
                stage = .finished
                stopTimer()
            }
        case "error":
            isStarting = false
            stage = .error
        default:
            break
        }
    }

    private func startTimer(limit: Int) {
        stopTimer()
        timeLeft = limit
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.reveal == nil else { return }
                self.timeLeft = max(0, self.timeLeft - 1)
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Categories (REST, same data the web app's /categories exposes)

    func loadCategories() {
        var comps = URLComponents()
        comps.scheme = "https"
        comps.host = Self.backendHost
        comps.path = "/categories"
        guard let url = comps.url else { return }
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let data, let list = try? JSONDecoder().decode([Category].self, from: data) else { return }
            Task { @MainActor in self?.categories = list }
        }.resume()
    }

    // MARK: - Actions (mirror App.js's startWithCategory/quickMatch/answer)

    func persistIdentity() {
        UserDefaults.standard.set(name, forKey: "quizzup.name")
        UserDefaults.standard.set(avatar, forKey: "quizzup.avatar")
    }

    func startWithCategory(_ key: String) {
        guard !isStarting else { return }
        isStarting = true
        persistIdentity()
        connect(["type": soloMode ? "solo" : "join", "name": name, "avatar": avatar, "category": key])
    }

    func quickMatch() {
        guard !isStarting else { return }
        isStarting = true
        persistIdentity()
        connect(["type": soloMode ? "solo" : "join", "name": name, "avatar": avatar, "category": NSNull()])
    }

    func answer(_ index: Int) {
        guard selectedAnswer == nil, reveal == nil else { return }
        selectedAnswer = index
        send(["type": "answer", "answerIndex": index])
    }

    func playAgain() {
        result = nil
        question = nil
        roundIntro = nil
        reveal = nil
        selectedAnswer = nil
        stage = .home
    }

    func disconnect() {
        stopTimer()
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        isStarting = false
    }
}
