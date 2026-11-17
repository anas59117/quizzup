enum NativeAvatarCatalogue {
    struct Option: Identifiable {
        let id: String
        let french: String
        let english: String

        func label(fr: Bool) -> String { fr ? french : english }
    }

    static let starters: [Option] = [
        .init(id: "robot", french: "Robot", english: "Robot"),
        .init(id: "fox", french: "Renard", english: "Fox"),
        .init(id: "cat", french: "Chat", english: "Cat"),
    ]
    private static let portraitIDs = Set(starters.map(\.id) + ["brain", "astronaut", "ninja", "dragon", "owl", "ghost", "lion"])
    private static let legacy = ["🦊": "fox", "🤖": "robot", "🧠": "brain", "👻": "ghost", "🐱": "cat", "🦉": "owl", "🐉": "dragon"]

    static func portraitID(for value: String) -> String {
        let id = legacy[value] ?? value
        return portraitIDs.contains(id) ? id : "robot"
    }

    static func starterSelection(for value: String) -> String {
        let id = portraitID(for: value)
        return starters.contains { $0.id == id } ? id : "robot"
    }
}
