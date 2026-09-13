import Foundation

// UI chrome only — mirrors frontend/src/i18n.js's scope and most of its
// keys. Category labels/icons come from the backend's /categories and are
// never translated here, same reasoning as the web app: a category's own
// language (e.g. "Foot Français") doesn't change with the UI language.
enum L10n {
    static let strings: [String: [String: String]] = [
        "fr": [
            "legendBack": "LA LÉGENDE EST DE RETOUR",
            "tagline": "Duels de culture générale en temps réel",
            "usernamePlaceholder": "Choisis ton pseudo",
            "continue": "Continuer →",
            "hey": "Salut {name}",
            "solo": "Solo",
            "multiplayer": "Multijoueur",
            "quickPlay": "Partie rapide",
            "randomTopic": "Thème aléatoire",
            "allThemes": "TOUS LES THÈMES",
            "searching": "Recherche en cours…",
            "searchingOpponent": "En recherche d'un adversaire…",
            "bonusRound": "MANCHE BONUS",
            "round": "Manche {n}",
            "doublePoints": "Points doublés !",
            "roundOf": "{n} sur {total}",
            "time": "TEMPS",
            "timeUp": "Temps écoulé",
            "wrong": "Faux",
            "ptsEarned": "+{n} pts",
            "finished": "TERMINÉ !",
            "victory": "VICTOIRE !",
            "draw": "MATCH NUL !",
            "defeat": "DÉFAITE",
            "someoneLeft": "Un joueur a quitté",
            "finalScore": "Score final : {n}",
            "matchScore": "Score du match",
            "finishBonus": "Bonus fin",
            "winBonus": "Bonus victoire",
            "xpTotal": "XP totale",
            "coins": "+{n} pièces",
            "rematch": "Revanche",
            "newGame": "Nouvelle partie",
            "newOpponent": "Nouvel adversaire",
            "backHome": "Retour à l'accueil",
            "connectionLost": "Connexion perdue",
            "serverUnreachable": "Impossible de joindre le serveur.",
            "retry": "Réessayer",
        ],
        "en": [
            "legendBack": "THE LEGEND IS BACK",
            "tagline": "Real-time trivia battles",
            "usernamePlaceholder": "Choose your username",
            "continue": "Continue →",
            "hey": "Hey {name}",
            "solo": "Solo",
            "multiplayer": "Multiplayer",
            "quickPlay": "Quick Play",
            "randomTopic": "Random topic",
            "allThemes": "ALL THEMES",
            "searching": "Searching…",
            "searchingOpponent": "Searching for an opponent…",
            "bonusRound": "BONUS ROUND",
            "round": "Round {n}",
            "doublePoints": "Double points!",
            "roundOf": "{n} of {total}",
            "time": "TIME",
            "timeUp": "Time up",
            "wrong": "Wrong",
            "ptsEarned": "+{n} pts",
            "finished": "FINISHED!",
            "victory": "VICTORY!",
            "draw": "DRAW!",
            "defeat": "DEFEAT",
            "someoneLeft": "Someone left",
            "finalScore": "Final score: {n}",
            "matchScore": "Match score",
            "finishBonus": "Finish bonus",
            "winBonus": "Win bonus",
            "xpTotal": "Total XP",
            "coins": "+{n} coins",
            "rematch": "Rematch",
            "newGame": "New game",
            "newOpponent": "New opponent",
            "backHome": "Back to home",
            "connectionLost": "Connection lost",
            "serverUnreachable": "Couldn't reach the game server.",
            "retry": "Retry",
        ],
    ]

    static func t(_ key: String, lang: String, _ vars: [String: String] = [:]) -> String {
        var template = strings[lang]?[key] ?? strings["fr"]?[key] ?? key
        for (k, v) in vars { template = template.replacingOccurrences(of: "{\(k)}", with: v) }
        return template
    }

    static func detectDefaultLang() -> String {
        if let saved = UserDefaults.standard.string(forKey: "quizzup.lang"), saved == "fr" || saved == "en" {
            return saved
        }
        let code = Locale.preferredLanguages.first ?? "en"
        return code.lowercased().hasPrefix("fr") ? "fr" : "en"
    }
}
