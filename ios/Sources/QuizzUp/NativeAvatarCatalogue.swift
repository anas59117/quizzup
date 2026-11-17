enum NativeAvatarCatalogue {
    struct Option: Identifiable {
        let id: String
        let french: String
        let english: String
        let price: Int

        func label(fr: Bool) -> String { fr ? french : english }

        func lockedPrice(owned: Set<String>) -> Int? {
            price > 0 && !owned.contains(id) ? price : nil
        }
    }

    static let options: [Option] = [
        .init(id: "robot", french: "Robot", english: "Robot", price: 0),
        .init(id: "fox", french: "Renard", english: "Fox", price: 0),
        .init(id: "cat", french: "Chat", english: "Cat", price: 0),
        .init(id: "brain", french: "Cerveau", english: "Brain", price: 500),
        .init(id: "astronaut", french: "Cosmo", english: "Cosmo", price: 450),
        .init(id: "ninja", french: "Ninja", english: "Ninja", price: 500),
        .init(id: "dragon", french: "Dragon", english: "Dragon", price: 600),
        .init(id: "owl", french: "Hibou", english: "Owl", price: 450),
        .init(id: "ghost", french: "Fantôme", english: "Ghost", price: 350),
        .init(id: "lion", french: "Lion", english: "Lion", price: 650),
    ]
    static let starters = options.filter { $0.price == 0 }
    private static let legacy = ["🦊": "fox", "🤖": "robot", "🧠": "brain", "👻": "ghost", "🐱": "cat", "🦉": "owl", "🐉": "dragon"]

    static func portraitID(for value: String) -> String {
        let id = legacy[value] ?? value
        return options.contains { $0.id == id } ? id : "robot"
    }

    static func starterSelection(for value: String) -> String {
        let id = portraitID(for: value)
        return starters.contains { $0.id == id } ? id : "robot"
    }
}
