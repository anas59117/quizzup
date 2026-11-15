import Foundation

enum NativeAppearance: String, CaseIterable, Identifiable {
    case system, light, dark
    static let storageKey = "quizzup.appearance"
    static let defaultValue: Self = .light
    var id: String { rawValue }

    static func stored(_ value: String?) -> Self { value.flatMap(Self.init(rawValue:)) ?? defaultValue }
    var explicitDark: Bool? {
        switch self {
        case .system: return nil
        case .light: return false
        case .dark: return true
        }
    }
    func resolvedDark(systemDark: Bool) -> Bool { explicitDark ?? systemDark }
}
