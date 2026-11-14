import Foundation

// Capture support is enabled only in a separately compiled simulator build.
// The Release application does not parse capture arguments or contain fixtures.
enum StoreCaptureConfiguration {
    static var enabled: Bool {
        #if DEBUG && STORE_CAPTURE
        return options != nil
        #else
        return false
        #endif
    }

    #if DEBUG && STORE_CAPTURE
    struct Options {
        let screen: String
        let language: String
        let appearance: NativeAppearance
    }

    static let options: Options? = {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "--store-capture-screen") else { return nil }
        let screens = [
            "home", "home-empty", "home-return", "waiting", "faceoff", "question", "question-photo", "answer", "result",
            "themes", "family", "detail", "detail-scrolled", "community", "community-compose", "settings",
            "messages", "messages-empty", "profile", "profile-empty",
            "auth", "auth-restoring", "auth-email", "auth-email-keyboard", "auth-email-create", "auth-email-reset",
            "question-muted", "community-suggestion",
            "thread", "play", "join",
            "room", "profile-edit", "settings-live",
        ]
        guard index + 1 < args.count,
              screens.contains(args[index + 1]),
              let languageIndex = args.firstIndex(of: "--store-capture-language"),
              languageIndex + 1 < args.count,
              ["fr", "en"].contains(args[languageIndex + 1]) else {
            preconditionFailure("Invalid store capture arguments")
        }
        var appearance = NativeAppearance.light
        if let appearanceIndex = args.firstIndex(of: "--store-capture-appearance") {
            guard appearanceIndex + 1 < args.count, let value = NativeAppearance(rawValue: args[appearanceIndex + 1]) else {
                preconditionFailure("Invalid capture appearance")
            }
            appearance = value
        }
        return Options(screen: args[index + 1], language: args[languageIndex + 1], appearance: appearance)
    }()

    @MainActor
    static func prepare(_ game: GameSocket) {
        guard let options else { return }
        UserDefaults.standard.set(options.appearance.rawValue, forKey: NativeAppearance.storageKey)
        if options.screen == "settings-live" {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                let target: NativeAppearance = options.appearance == .dark ? .light : .dark
                UserDefaults.standard.set(target.rawValue, forKey: NativeAppearance.storageKey)
            }
        }
        game.disconnect()
        game.lang = options.language
        game.name = "Alex"
        game.avatar = "fox"
        game.myId = "store-demo-alex"
        game.clientId = "store-demo-alex"
        game.soloMode = false
        // Reuse the bundled real catalogue; only account/score values are fixtures.
        game.categories = NativeCatalog.entries.keys.sorted().map { key in
            let entry = NativeCatalog.entries[key]!
            return Category(key: key, label: entry.label, icon: entry.icon ?? "", count: 0)
        }
        game.followedThemes = ["ligue_champions", "rap_fr", "harry_potter", "minecraft"]
        game.topicProgress = [.init(key: "ligue_champions", level: 8), .init(key: "rap_fr", level: 5), .init(key: "harry_potter", level: 3), .init(key: "minecraft", level: 2)]
        game.stats = PlayerStats(games: 27, wins: 16, streak: 2, xp: 1620, level: 4, xpIntoLevel: 420, xpForLevel: 800)
        game.friends = [NativeFriend(id: "store-demo-camille", name: "Camille", avatar: "owl", online: true), NativeFriend(id: "store-demo-sam", name: "Sam", avatar: "astronaut", online: false)]
        let message = NativeMessage(id: "store-message", fromId: "store-demo-camille", toId: "store-demo-alex", kind: "text", text: options.language == "fr" ? "On se fait une revanche ?" : "Ready for a rematch?", createdAt: 1793920000000)
        game.conversations = [NativeConversation(peer: game.friends[0], lastMessage: message, unread: 1)]
        if options.screen == "thread" {
            game.messages["store-demo-camille"] = [message, NativeMessage(id: "store-reply", fromId: "store-demo-alex", toId: "store-demo-camille", kind: "text", text: options.language == "fr" ? "Avec plaisir, on joue sur quel thème ?" : "Absolutely! Which topic?", createdAt: 1793920060000)]
        }
        if options.screen == "community" {
            // Visual test fixtures only: this code is excluded from Release and never publishes.
            let post = NativeCommunityPost(id: "store-post", authorId: "store-demo-camille", authorName: "Camille", authorAvatar: "owl", authorFollowed: false, category: "science", text: options.language == "fr" ? "La question qui m’a fait hésiter aujourd’hui…" : "The question that made me hesitate today…", mediaUrl: nil, question: NativeCommunityQuestion(prompt: "Combien de planètes compte le système solaire ?", answers: ["7", "8", "9", "10"]), reactions: 2, reacted: false, commentsCount: 1, createdAt: 1793920000000)
            game.community.posts = [post]
            game.community.answers[post.id] = NativeCommunityAnswer(postId: post.id, answerIndex: 1, correctIndex: 1)
        }
        if ["home-empty", "home-return", "messages-empty", "profile-empty"].contains(options.screen) {
            game.topicProgress = []
            game.followedThemes = []
            game.friends = []
            game.conversations = []
            game.stats = PlayerStats(games: 0, wins: 0, streak: 0, xp: 0, level: 1, xpIntoLevel: 0, xpForLevel: 200)
        }
        game.opponents = [Opponent(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 28)]
        game.score = options.screen == "result" ? 118 : 34
        game.totalRounds = 6
        game.timeLeft = 8
        game.answersVisible = true
        game.answerInputOpen = options.screen != "answer"
        if options.screen == "answer" {
            game.selectedAnswer = 1; game.answerAccepted = true; game.answerCorrect = true; game.answerPoints = 18; game.score = 52
        }
        game.roundIntro = RoundIntro(round: 1, totalRounds: 6, category: "Science", icon: "", isBonus: false)
        // Verbatim existing science question and options, in both UI locales.
        game.question = Question(
            round: 3, totalRounds: 6,
            question: "Combien de planètes compte le système solaire ?",
            category: "Science", icon: "🧬", answers: ["7", "8", "9", "10"],
            timeLimit: 10, isBonus: false, image: nil, credit: nil
        )
        if options.screen == "question-photo" {
            let source = NativeCatalog.entry(for: "spider_man")?.src
            game.question = Question(
                round: 2, totalRounds: 6,
                question: options.language == "fr" ? "Quel personnage est représenté ?" : "Which character is pictured?",
                category: "Marvel", icon: "", answers: ["Spider-Man", "Batman", "Thor", "Superman"],
                timeLimit: 10, isBonus: false, image: source, credit: nil
            )
            if let source, let url = GameSocket.absoluteImageURL(source) { NativeImageCache.shared.prefetch([url]) }
        }
        game.result = GameEnd(
            finalScore: 118, won: true, tie: false,
            others: [OpponentFinal(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 96)],
            leaderboard: [
                LeaderboardRow(id: "store-demo-alex", name: "Alex", avatar: "fox", score: 118),
                LeaderboardRow(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 96)
            ],
            reason: "complete", coins: 50, xp: 258,
            xpBreakdown: XpBreakdown(matchScore: 118, finishBonus: 40, winBonus: 100, xpTotal: 258),
            stats: PlayerStats(games: 27, wins: 16, streak: 2, xp: 1620, level: 4, xpIntoLevel: 420, xpForLevel: 800)
        )
        switch options.screen {
        case "join": game.stage = .join
        case let screen where screen.hasPrefix("auth"): game.stage = .authGate
        case "waiting": game.stage = .waiting
        case "faceoff": game.stage = .roundIntro
        case "question", "question-photo", "question-muted", "answer": game.stage = .question
        case "result": game.stage = .finished
        default: game.stage = .home
        }
    }

    @MainActor
    static func markReady() {
        guard let options else { return }
        let delay = options.screen == "settings-live" ? 4.0 : ["home-return", "question-photo", "auth-email-keyboard"].contains(options.screen) ? 3.0 : 1.0
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let receipt: [String: String] = ["screen": options.screen, "language": options.language, "appearance": options.appearance.rawValue, "storedAppearance": NativeAppearance.stored(UserDefaults.standard.string(forKey: NativeAppearance.storageKey)).rawValue]
            do {
                try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                let data = try JSONSerialization.data(withJSONObject: receipt)
                try data.write(to: directory.appendingPathComponent("store-capture-ready.json"), options: .atomic)
            } catch {
                preconditionFailure("Cannot write store capture readiness receipt")
            }
        }
    }
    #endif
}
