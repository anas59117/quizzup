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
            "question-muted", "community-suggestion", "community-discussion", "community-empty",
            "thread", "play", "join",
            "room", "profile-edit", "settings-live",
            "profile-help", "profile-friends", "personal-posts", "result-level-up",
            "onboarding-home", "onboarding-rules", "onboarding-trial", "onboarding-help", "onboarding-progression",
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
        game.stats = PlayerStats(games: 27, wins: 16, streak: 2, xp: 4860, level: 4, xpIntoLevel: 1260, xpForLevel: 2400)
        game.friends = [
            NativeFriend(id: "store-demo-camille", name: "Camille", avatar: "owl", online: true),
            NativeFriend(id: "store-demo-sam", name: "Sam", avatar: "astronaut", online: false),
            NativeFriend(id: "store-demo-lou", name: "Lou", avatar: "cat", online: false),
            NativeFriend(id: "store-demo-noa", name: "Noa", avatar: "brain", online: true),
            NativeFriend(id: "store-demo-marie", name: "Marie", avatar: "robot", online: false)
        ]
        let message = NativeMessage(id: "store-message", fromId: "store-demo-camille", toId: "store-demo-alex", kind: "text", text: options.language == "fr" ? "On se fait une revanche ?" : "Ready for a rematch?", createdAt: 1793920000000)
        game.conversations = [NativeConversation(peer: game.friends[0], lastMessage: message, unread: 1)]
        if options.screen == "thread" {
            game.messages["store-demo-camille"] = [message, NativeMessage(id: "store-reply", fromId: "store-demo-alex", toId: "store-demo-camille", kind: "text", text: options.language == "fr" ? "Avec plaisir, on joue sur quel thème ?" : "Absolutely! Which topic?", createdAt: 1793920060000)]
        }
        if options.screen.hasPrefix("community") || options.screen == "personal-posts", options.screen != "community-empty" {
            let personal = options.screen == "personal-posts"
            // Visual test fixtures only: this code is excluded from Release and never publishes.
            let origin = "https://\(GameSocket.frontendHost)"
            let spider = "/images/covers/approved-v2/spider_man-640.webp"
            let marvel = "/images/covers/approved-v2/marvel-640.webp"
            let now = Date().timeIntervalSince1970 * 1000
            let first = NativeCommunityReply(id: "store-comment-1", authorId: "store-fan-1", authorName: "WebHeadClub", authorAvatar: origin + spider, text: options.language == "fr" ? "Andrew méritait un troisième film. Son retour était incroyable." : "Andrew deserved a third film. His return was incredible.", createdAt: now - 480_000, reactions: 4)
            let answer = NativeCommunityReply(id: "store-comment-2", authorId: "store-fan-2", authorName: "AvengersHQ", authorAvatar: origin + marvel, text: options.language == "fr" ? "La scène dans No Way Home m’a tellement marqué !" : "That scene in No Way Home was unforgettable!", createdAt: now - 360_000, parentId: first.id, reactions: 2, reacted: true)
            let third = NativeCommunityReply(id: "store-comment-3", authorId: "store-fan-3", authorName: "YamalFan", authorAvatar: origin + "/images/players/lamine_yamal.jpg", text: options.language == "fr" ? "Tobey pour l’émotion. La scène du train reste imbattable." : "Tobey for the emotion. The train scene is unbeatable.", createdAt: now - 120_000, reactions: 3)
            let post = NativeCommunityPost(id: "store-post", authorId: personal ? game.clientId : nil, authorName: personal ? game.name : "QuizzUp", authorAvatar: personal ? game.avatar : "robot", authorFollowed: false, category: "spider_man", text: options.language == "fr" ? "Votre Spider-Man préféré ? Tobey, Andrew ou Tom ? On ouvre le débat : lequel vous a le plus marqué, et pourquoi ?" : "Your favourite Spider-Man? Tobey, Andrew or Tom? Which one left the biggest impression, and why?", mediaUrl: nil, question: nil, reactions: 12, reacted: false, commentsCount: 3, createdAt: now - 720_000, isOfficial: !personal, lastComment: third)
            let next = NativeCommunityPost(id: "store-post-2", authorId: nil, authorName: "QuizzUp", authorAvatar: "robot", authorFollowed: false, category: "marvel", text: options.language == "fr" ? "Infinity War ou Endgame ? On ouvre le débat : lequel vous a le plus marqué, et pourquoi ?" : "Infinity War or Endgame? Which one left the biggest impression, and why?", mediaUrl: nil, question: nil, reactions: 0, reacted: false, commentsCount: 0, createdAt: now - 2_280_000, isOfficial: true)
            if personal { game.community.filter = .init(mine: true) }
            game.community.posts = personal ? [post] : [post, next]
            game.community.replies[post.id] = [first, answer, third]
            game.community.loadedReplyPosts.insert(post.id)
            game.community.latestPost = post
        }
        if ["home-empty", "home-return", "messages-empty", "profile-empty"].contains(options.screen) {
            game.topicProgress = []
            game.followedThemes = []
            game.friends = []
            game.conversations = []
            game.stats = PlayerStats(games: 0, wins: 0, streak: 0, xp: 0, level: 1, xpIntoLevel: 0, xpForLevel: 600)
        }
        game.opponents = [Opponent(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 28)]
        game.score = ["result", "result-level-up"].contains(options.screen) ? 118 : 34
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
        let levelUp = options.screen == "result-level-up"
        game.result = GameEnd(
            finalScore: 118, won: true, tie: false,
            others: [OpponentFinal(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 96)],
            leaderboard: [
                LeaderboardRow(id: "store-demo-alex", name: "Alex", avatar: "fox", score: 118),
                LeaderboardRow(id: "store-demo-camille", name: "Camille", avatar: "owl", score: 96)
            ],
            reason: "complete", coins: 50, xp: 258,
            xpBreakdown: XpBreakdown(matchScore: 118, finishBonus: 40, winBonus: 100, xpTotal: 258),
            stats: levelUp
                ? PlayerStats(games: 27, wins: 16, streak: 2, xp: 6090, level: 5, xpIntoLevel: 90, xpForLevel: 3000)
                : PlayerStats(games: 27, wins: 16, streak: 2, xp: 4860, level: 4, xpIntoLevel: 1260, xpForLevel: 2400),
            progressionBefore: levelUp
                ? NativeProgressionSnapshot(level: 4, xpIntoLevel: 2232, xpForLevel: 2400)
                : NativeProgressionSnapshot(level: 4, xpIntoLevel: 1002, xpForLevel: 2400)
        )
        if options.screen.hasPrefix("onboarding-") {
            let state = NativeOnboardingState(version: 1, status: options.screen == "onboarding-home" ? .pending : .completed,
                rulesSeen: false, communitySeen: false, progressionSeen: false, profileComplete: true)
            game.onboarding.identify(accountID: "store-demo-alex", state: state)
            if ["onboarding-rules", "onboarding-trial", "onboarding-help"].contains(options.screen) {
                game.onboardingLaunch = NativeOnboardingLaunch(category: "science", solo: false,
                    manual: options.screen == "onboarding-help", initialPractice: options.screen == "onboarding-trial")
            }
            game.onboardingProgressionVisible = options.screen == "onboarding-progression"
        }
        switch options.screen {
        case "onboarding-progression": game.stage = .finished
        case "join": game.stage = .join
        case let screen where screen.hasPrefix("auth"): game.stage = .authGate
        case "waiting": game.stage = .waiting
        case "faceoff": game.stage = .roundIntro
        case "question", "question-photo", "question-muted", "answer": game.stage = .question
        case "result", "result-level-up": game.stage = .finished
        default: game.stage = .home
        }
    }

    @MainActor
    static func markReady() {
        guard let options else { return }
        let delay = options.screen == "settings-live" ? 4.0 : options.screen.hasPrefix("community") || ["home-return", "question-photo", "auth-email-keyboard", "personal-posts", "profile-help", "profile-friends", "result", "result-level-up"].contains(options.screen) ? 3.0 : 1.0
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
