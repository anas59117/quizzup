import Foundation

struct NativeCatalogEntry: Decodable {
    let label: String
    let englishLabel: String?
    let family: String
    let src: String?
    let fit: String?
    let description: String?
    let assetName: String?
    let icon: String?
}

struct NativeTopicFamily: Identifiable {
    let id: String
    let french: String
    let english: String
    let symbol: String
    func title(lang: String) -> String { lang == "fr" ? french : english }
}

enum NativeCatalog {
    static let featuredKeys = ["spider_man", "harry_potter", "minecraft", "rap_fr", "ligue_champions", "marvel", "one_piece", "pokemon"]
    static let entries: [String: NativeCatalogEntry] = {
        guard let url = Bundle.main.url(forResource: "topic-catalog", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let result = try? JSONDecoder().decode([String: NativeCatalogEntry].self, from: data) else { return [:] }
        return result
    }()
    private static let popularityRanks: [String: Int] = {
        guard let url = Bundle.main.url(forResource: "topicPopularity", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let order = try? JSONDecoder().decode([String: [String]].self, from: data) else { return [:] }
        let ranks = order.values.flatMap { keys in
            keys.enumerated().map { (keyIndex, key) in (key, keyIndex) }
        }
        return Dictionary(ranks, uniquingKeysWith: min)
    }()
    static let families: [NativeTopicFamily] = [
        .init(id: "sport", french: "Sport", english: "Sport", symbol: "figure.run"),
        .init(id: "football", french: "Football", english: "Football", symbol: "soccerball"),
        .init(id: "cinema", french: "Cinéma", english: "Cinema", symbol: "film"),
        .init(id: "series", french: "Séries", english: "TV series", symbol: "tv"),
        .init(id: "music", french: "Musique", english: "Music", symbol: "music.note"),
        .init(id: "sagas", french: "Sagas", english: "Sagas", symbol: "sparkles"),
        .init(id: "manga", french: "Manga & anime", english: "Manga & anime", symbol: "book.closed"),
        .init(id: "gaming", french: "Jeux vidéo", english: "Gaming", symbol: "gamecontroller"),
        .init(id: "culture", french: "Culture générale", english: "General knowledge", symbol: "globe.europe.africa")
    ]
    static func entry(for key: String) -> NativeCatalogEntry? { entries[key] }
    static func orderedByPopularity(_ categories: [Category]) -> [Category] {
        categories.sorted { left, right in
            (popularityRanks[left.key] ?? Int.max) < (popularityRanks[right.key] ?? Int.max)
        }
    }
    static func title(for category: Category, lang: String) -> String {
        guard let entry = entries[category.key] else { return category.label }
        if lang != "fr", let english = entry.englishLabel, !english.isEmpty { return english }
        return entry.label
    }
    static func familyTitle(for category: Category, lang: String) -> String {
        families.first { $0.id == entries[category.key]?.family }?.title(lang: lang) ?? "Quiz"
    }
    static func mark(for title: String) -> String {
        let words = title.split(separator: " ")
        if words.count > 1 { return words.prefix(2).compactMap { $0.first }.map { String($0) }.joined().uppercased() }
        return String(title.prefix(2)).uppercased()
    }
    static func matches(_ category: Category, query: String, lang: String) -> Bool {
        let text = "\(title(for: category, lang: lang)) \(category.label) \(category.key) \(familyTitle(for: category, lang: lang))"
        return text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
            .contains(query.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current))
    }
}
