import SwiftUI

// Same palette as frontend/src/App.css's dark theme tokens, so the native
// app reads as the same brand even though the UI code is independent.
enum Theme {
    static let bg = Color(hex: 0x0F0F1A)
    static let surface = Color(hex: 0x1A1A2E)
    static let surface2 = Color(hex: 0x22223A)
    static let border = Color(hex: 0x2A2A42)
    static let text = Color(hex: 0xF0F0F5)
    static let textDim = Color(hex: 0x9A9AB0)
    static let accent = Color(hex: 0xE91E63)
    static let gold = Color(hex: 0xFFC107)
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
