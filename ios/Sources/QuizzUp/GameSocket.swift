import Foundation
import Combine

enum Stage {
    case authGate, join, home, waiting, roundIntro, question, finished, error
}

/// Talks to the same Node.js/WebSocket backend as the web app (backend/server.js).
/// Unlike the web app (which allows anonymous play), this app requires a
/// real Firebase-backed account (Sign in with Apple/Google, see
/// AuthManager) before .join — a deliberate product decision for the iOS
/// version. Once signed in, `identify` is sent with a real ID token, so
/// friends/stats/feed all work identically to a Google-linked web player.
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
        if path.hasPrefix("https://") { return URL(string: path) }
        guard path.hasPrefix("/") && !path.hasPrefix("//") else { return nil }
        let host = path.hasPrefix("/profile-photos/") ? backendHost : frontendHost
        return URL(string: "https://\(host)\(path)")
    }

    @Published var stage: Stage = .authGate
    @Published private(set) var openingProfile = false
    var needsNickname = false
    @Published var name: String = UserDefaults.standard.string(forKey: "quizzup.name") ?? ""
    @Published var avatar: String = UserDefaults.standard.string(forKey: "quizzup.avatar") ?? "robot"
    @Published var soloMode = false
    // True from the moment a join/solo/quick-match request is sent until
    // the server actually answers (waiting, round_intro, or error) — guards
    // against a double-tap firing two start requests before the server's
    // own re-entrancy check (isInActiveGame in server.js) can see the first.
    @Published var isStarting = false
    @Published var categories: [Category] = []
    @Published var lang: String = L10n.detectDefaultLang()

    func t(_ key: String, _ vars: [String: String] = [:]) -> String { L10n.t(key, lang: lang, vars) }
    func toggleLang() { setLanguage(lang == "fr" ? "en" : "fr") }

    func setLanguage(_ language: String) {
        lang = language
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
    @Published var connected = false
    @Published var clientId: String?
    @Published var stats: PlayerStats?
    @Published var topicProgress: [NativeTopicProgress] = []
    @Published var followedThemes: [String] = []
    @Published var friends: [NativeFriend] = []
    @Published var friendRequests: [NativeFriend] = []
    @Published var conversations: [NativeConversation] = []
    @Published var messages: [String: [NativeMessage]] = [:]
    @Published var socialError: String?
    @Published var socialNotice: String?
    @Published var conversationOpen = false
    @Published var activeConversation: String?
    @Published var pendingMessageID: String?
    @Published var lastSentMessageID: String?
    @Published var inboxLoading = false
    @Published var historyLoading = false
    @Published var historyHasMore: [String: Bool] = [:]
    @Published var answersVisible = false
    @Published var answerInputOpen = false
    @Published var answerAccepted = false
    @Published var answerPoints = 0
    @Published var answerCorrect: Bool?
    @Published var cancelPending = false
    @Published var rematchWaiting = false
    @Published var profileSaving = false

    private var task: URLSessionWebSocketTask?
    private var timer: Timer?
    private var timelineGeneration = UUID()
    var messageAttempt = UUID()
    private var generation = UUID()
    private var pendingAction: [String: Any]?
    // Set once by identify(idToken:authManager:) after sign-in. Kept only as
    // a fallback for the immediate identify — every reconnect asks
    // `authManager` for a fresh token instead, since Firebase ID tokens
    // expire after ~1 hour and a long-idle socket can easily outlive that.
    private var idToken: String?
    private weak var authManager: AuthManager?

    // MARK: - Connection

    private func ensureConnected() {
        guard !StoreCaptureConfiguration.enabled else { return }
        guard task == nil else { return }
        var comps = URLComponents()
        comps.scheme = "wss"
        comps.host = Self.backendHost
        comps.path = "/ws"
        guard let url = comps.url else { return }
        let t = URLSession.shared.webSocketTask(with: url)
        generation = UUID()
        connected = false
        task = t
        t.resume()
        listen()
        if let idToken {
            send(["type": "identify", "idToken": idToken, "name": openingProfile ? "" : name,
                  "avatar": openingProfile ? "robot" : avatar, "presentationVersion": 1])
        }
    }

    /// Opens a socket (if needed) with an up-to-date ID token, then sends
    /// `payload` — used for join/solo requests so identify always rides on
    /// a fresh token instead of one that may have expired since sign-in.
    private func connect(_ payload: [String: Any]) {
        guard !StoreCaptureConfiguration.enabled else { return }
        if connected { send(payload); return }
        pendingAction = payload
        guard task == nil, let authManager else { ensureConnected(); return }
        let key = generation
        Task {
            let fresh = await authManager.getIdToken()
            guard generation == key, self.authManager === authManager else { return }
            guard let fresh else {
                isStarting = false; profileSaving = false; socialError = t("serverUnreachable"); return
            }
            self.idToken = fresh
            self.ensureConnected()
        }
    }

    /// Called once after AuthManager completes sign-in. Establishes the
    /// socket and sends `identify` with a real Firebase ID token — the same
    /// handshake the web app does for a Google-linked player, so friends/
    /// stats/feed all resolve to the same clientId server-side.
    func identify(idToken: String, authManager: AuthManager) {
        self.idToken = idToken
        self.authManager = authManager
        openingProfile = true
        ensureConnected()
    }

    @discardableResult
    func send(_ payload: [String: Any]) -> Bool {
        guard !StoreCaptureConfiguration.enabled, let task,
              connected || payload["type"] as? String == "identify",
              let data = try? JSONSerialization.data(withJSONObject: payload) else { return false }
        let key = generation
        task.send(.data(data)) { [weak self] error in
            if error != nil { Task { @MainActor in
                guard let self, self.generation == key else { return }
                self.socialError = self.t("serverUnreachable")
            } }
        }
        return true
    }

    private func listen() {
        let key = generation
        task?.receive { [weak self] result in
            Task { @MainActor in
                guard let self, self.generation == key else { return }
                switch result {
                case .failure: self.disconnect(); self.stage = .error
                case .success(let message):
                    if case .data(let data) = message { self.handle(data) }
                    if case .string(let str) = message, let data = str.data(using: .utf8) { self.handle(data) }
                    if self.generation == key { self.listen() }
                }
            }
        }
    }

    func handle(_ data: Data) {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = obj["type"] as? String else { return }
        let decoder = JSONDecoder()
        if handleSocial(type, object: obj) { return }

        switch type {
        case "session":
            myId = obj["playerId"] as? String
        case "identified":
            connected = true; socialError = nil
            if let profile = obj["profile"] as? [String: Any] {
                clientId = profile["id"] as? String
                if let value = profile["name"] as? String { name = value }
                if let value = profile["avatar"] as? String { avatar = value }
                persistIdentity()
            }
            if openingProfile {
                openingProfile = false
                if stage == .authGate {
                    let confirmed = clientId.map { UserDefaults.standard.bool(forKey: "quizzup.profileConfirmed.\($0)") } ?? false
                    // The backend gives newly identified sockets a temporary PlayerNNNN name.
                    let generatedName = name.range(of: #"^Player[1-9][0-9]{3}$"#, options: .regularExpression) != nil
                    needsNickname = !(confirmed || (clientId != nil && !name.isEmpty && !generatedName))
                    if needsNickname { name = "" }
                    stage = needsNickname ? .join : .home
                }
            }
            if obj["reconnected"] as? Bool == true {
                isStarting = false
                if ["join", "solo"].contains(pendingAction?["type"] as? String ?? "") { pendingAction = nil }
            }
            if let action = pendingAction { pendingAction = nil; send(action) }
            if let peer = activeConversation { openConversation(peer) }
            if conversationOpen { requestInbox() }
        case "queue_cancelled": cancelPending = false; isStarting = false; stage = .home
        case "queue_cancel_failed": cancelPending = false
        case "rematch_waiting", "rematch_starting": rematchWaiting = true
        case "rematch_cancelled", "rematch_unavailable":
            rematchWaiting = false
            if type == "rematch_unavailable" { socialError = lang == "fr" ? "Cet adversaire n’est plus disponible." : "This opponent is no longer available." }
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
            cancelPending = false; rematchWaiting = false
            // No stage change here — the server always sends round_intro
            // immediately after game_start, which drives the transition.
        case "game_reconnected":
            isStarting = false
            if let restored = decode(obj["opponents"], as: [Opponent].self) { opponents = restored }
            score = obj["score"] as? Int ?? score
            totalRounds = obj["totalRounds"] as? Int ?? totalRounds
            if let me = obj["you"] as? [String: Any] {
                name = me["name"] as? String ?? name; avatar = me["avatar"] as? String ?? avatar
            }
        case "player_reconnected":
            if let id = obj["playerId"] as? String {
                if opponents.count == 1 { opponents[0].id = id }
                else if let name = obj["name"] as? String {
                    let matches = opponents.indices.filter { opponents[$0].name == name }
                    if matches.count == 1 { opponents[matches[0]].id = id }
                }
            }
        case "round_intro":
            if let intro = try? decoder.decode(RoundIntro.self, from: data) {
                roundIntro = intro
                question = nil
                reveal = nil
                selectedAnswer = nil
                answerAccepted = false; answerCorrect = nil; answerPoints = 0
                stage = .roundIntro
            }
        case "question":
            if let q = try? decoder.decode(Question.self, from: data) {
                question = q
                selectedAnswer = obj["yourAnswer"] as? Int
                reveal = nil
                answerAccepted = (obj["answered"] as? Bool) == true
                answerCorrect = obj["yourCorrect"] as? Bool
                answerPoints = obj["pointsEarned"] as? Int ?? 0
                if obj["reconnect"] as? Bool != true {
                    for index in opponents.indices { opponents[index].answered = false; opponents[index].correct = false }
                }
                stage = .question
                startTimer(question: q)
                if answerAccepted { stopTimer() }
            }
        case "answer_ack":
            guard obj["round"] as? Int == question?.round else { return }
            selectedAnswer = obj["yourAnswer"] as? Int
            answerAccepted = true; answerInputOpen = false
            answerCorrect = obj["yourCorrect"] as? Bool
            answerPoints = obj["pointsEarned"] as? Int ?? 0
            score = obj["yourScore"] as? Int ?? score
            stopTimer()
        case "opponent_answered":
            if let id = obj["id"] as? String, let index = opponents.firstIndex(where: { $0.id == id }) { opponents[index].answered = true }
        case "round_result":
            if let r = try? decoder.decode(RoundResult.self, from: data) {
                reveal = r
                selectedAnswer = r.yourAnswer
                score = r.yourScore
                answersVisible = true; answerInputOpen = false
                for other in r.others {
                    if let index = opponents.firstIndex(where: { $0.id == other.id }) {
                        opponents[index].answered = other.answered; opponents[index].correct = other.correct
                        if let points = other.score { opponents[index].score = points }
                    }
                }
                stopTimer()
            }
        case "game_end":
            if let end = try? decoder.decode(GameEnd.self, from: data) {
                result = end
                score = end.finalScore
                stats = end.stats ?? stats
                if let raw = obj["stats"] as? [String: Any] { updateStats(raw) }
                stage = .finished
                isStarting = false
                stopTimer()
            }
        case "already_playing": isStarting = false
        case "auth_required", "already_connected":
            disconnect()
            socialError = t("serverUnreachable")
            stage = .error
        case "error":
            isStarting = false
            if openingProfile { disconnect() }
            stage = .error
        default:
            break
        }
    }

    private func startTimer(question: Question) {
        stopTimer()
        let key = timelineGeneration
        let timeline = NativeRoundTimeline(question: question)
        let update = { [weak self] in
            guard let self, self.timelineGeneration == key else { return }
            let phase = timeline.state(at: Date())
            self.answersVisible = phase.visible
            self.answerInputOpen = phase.open && self.selectedAnswer == nil && !self.answerAccepted && self.reveal == nil
            self.timeLeft = phase.seconds
        }
        update()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in Task { @MainActor in update() } }
    }

    private func stopTimer() {
        timelineGeneration = UUID()
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Categories (REST, same data the web app's /categories exposes)

    func loadCategories() {
        guard !StoreCaptureConfiguration.enabled else { return }
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
        connect(["type": soloMode ? "solo" : "join", "name": name, "avatar": avatar, "category": key, "presentationVersion": 1])
    }

    func quickMatch() {
        guard !isStarting else { return }
        isStarting = true
        persistIdentity()
        connect(["type": soloMode ? "solo" : "join", "name": name, "avatar": avatar, "category": NSNull(), "presentationVersion": 1])
    }

    func answer(_ index: Int) {
        guard answerInputOpen, selectedAnswer == nil, reveal == nil,
              let question, question.answers.indices.contains(index) else { return }
        if send(["type": "answer", "answerIndex": index]) { selectedAnswer = index; answerInputOpen = false }
    }

    func playAgain() {
        isStarting = false
        result = nil
        question = nil
        roundIntro = nil
        reveal = nil
        selectedAnswer = nil
        stage = .home
    }

    func completeProfile() {
        guard !profileSaving else { return }
        profileSaving = true
        connect(["type": "profile_update", "name": String(name.trimmingCharacters(in: .whitespacesAndNewlines).prefix(20)), "avatar": avatar])
    }
    func requestProfile() {
        guard !StoreCaptureConfiguration.enabled, task == nil, let authManager else { return }
        let key = generation
        Task {
            let fresh = await authManager.getIdToken()
            guard generation == key, self.authManager === authManager, let fresh else { return }
            idToken = fresh; ensureConnected()
        }
    }
    func cancelQueue() { if !cancelPending, send(["type": "cancel_queue"]) { cancelPending = true } }
    func requestRematch() { if !rematchWaiting, send(["type": "rematch"]) { rematchWaiting = true } }
    func retryConnection() {
        if openingProfile || needsNickname {
            disconnect()
            stage = .authGate
        } else {
            stage = .home
            requestProfile()
        }
    }

    func decode<T: Decodable>(_ value: Any?, as type: T.Type) -> T? {
        guard let value, JSONSerialization.isValidJSONObject(value), let data = try? JSONSerialization.data(withJSONObject: value) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    // MARK: - Report / Block (Guideline 1.2)

    func reportUser(targetId: String, targetName: String, reason: String = "offensive") async throws {
        try await moderate(path: "/users/report", payload: ["targetId": targetId, "targetName": targetName, "reason": reason])
    }

    func blockUser(targetId: String) async throws {
        try await moderate(path: "/users/block", payload: ["targetId": targetId])
        friends.removeAll { $0.id == targetId }; conversations.removeAll { $0.id == targetId }
        messages.removeValue(forKey: targetId)
    }

    private func moderate(path: String, payload: [String: String]) async throws {
        let key = generation
        guard !StoreCaptureConfiguration.enabled, let token = await authManager?.getIdToken(),
              generation == key,
              let url = URL(string: "https://\(Self.backendHost)\(path)") else { throw URLError(.userAuthenticationRequired) }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)
        let (data, response) = try await URLSession.shared.data(for: req)
        guard generation == key else { throw URLError(.cancelled) }
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
              let body = try JSONSerialization.jsonObject(with: data) as? [String: Any], body["ok"] as? Bool == true else { throw URLError(.badServerResponse) }
    }

    func disconnect() {
        generation = UUID()
        messageAttempt = UUID()
        stopTimer()
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        isStarting = false
        connected = false; cancelPending = false; profileSaving = false
        inboxLoading = false; historyLoading = false; pendingMessageID = nil
    }

    /// Called after AuthManager.signOut() so a signed-out user can't keep
    /// using the socket identity from the previous account, and lands back
    /// on the mandatory auth gate instead of wherever they were in the app.
    func resetForSignOut() {
        disconnect()
        idToken = nil
        authManager = nil
        openingProfile = false
        needsNickname = false
        name = ""; avatar = "robot"
        pendingAction = nil; clientId = nil; stats = nil
        activeConversation = nil; conversationOpen = false; lastSentMessageID = nil
        friends = []; friendRequests = []; conversations = []; messages = [:]
        historyHasMore = [:]
        topicProgress = []; followedThemes = []
        stage = .authGate
    }
}
