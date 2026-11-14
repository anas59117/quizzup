import Foundation

enum NativeAppearance: String, CaseIterable, Identifiable {
    case system, light, dark
    static let storageKey = "quizzup.appearance"
    var id: String { rawValue }

    static func stored(_ value: String?) -> Self { .system }
    var explicitDark: Bool? { nil }
    func resolvedDark(systemDark: Bool) -> Bool { false }
}
