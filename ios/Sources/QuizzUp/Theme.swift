import SwiftUI

// Editorial browsing palette shared with the current website. The duel keeps
// its dedicated dark canvas; ivory surfaces always use ink, not white text.
enum Theme {
    static let brand = Color(hex: 0xBD1235)
    static let paper = Color(hex: 0xFFFAF2)
    static let ink = Color(hex: 0x30272D)
    static let muted = Color(hex: 0x6B5961)
    static let canvas = Color(hex: 0x101512)
    static let bg = Color(hex: 0x0F0F1A)
    static let surface = Color(hex: 0x1A1A2E)
    static let surface2 = Color(hex: 0x22223A)
    static let border = Color(hex: 0x2A2A42)
    static let text = Color(hex: 0xF0F0F5)
    static let textDim = Color(hex: 0x9A9AB0)
    static let accent = brand
    static let gold = Color(hex: 0xFFDD55)
    static let green = Color(hex: 0x2E7D32)
    static let red = Color(hex: 0xC62828)
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
