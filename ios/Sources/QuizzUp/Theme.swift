import SwiftUI
import UIKit

// Adaptive browsing surfaces; brand fills and artwork/gold-button ink stay fixed.
enum Theme {
    static let brand = Color(hex: 0xBD1235)
    static let pageBackground = adaptive(0xBD1235, 0x181417)
    static let contentBackground = adaptive(0xFFFAF2, 0x181417)
    static let paper = adaptive(0xFFFAF2, 0x241E23)
    static let card = adaptive(0xFFFFFF, 0x30272D)
    static let field = adaptive(0xF0E8E5, 0x30272D)
    static let separator = adaptive(0xE8DEDB, 0x53434D)
    static let controlBorder = adaptive(0x806D78, 0x89747F)
    static let ink = adaptive(0x30272D, 0xFFFAF2)
    static let muted = adaptive(0x6B5961, 0xC2AFB7)
    static let onGold = Color(hex: 0x30272D)
    static let lightPaper = Color(hex: 0xFFFAF2)
    static let challengeBackground = adaptive(0xFFF0BB, 0x332A1C)
    static let canvas = Color(hex: 0x101512)
    static let bg = Color(hex: 0x0F0F1A)
    static let surface = Color(hex: 0x1A1A2E)
    static let surface2 = Color(hex: 0x22223A)
    static let border = Color(hex: 0x2A2A42)
    static let text = Color(hex: 0xF0F0F5)
    static let textDim = Color(hex: 0x9A9AB0)
    static let accent = adaptive(0xBD1235, 0xFF7892)
    static let gold = Color(hex: 0xFFDD55)
    static let green = adaptive(0x2E7D32, 0x81C784)
    static let red = adaptive(0xC62828, 0xFF8994)

    static func colorScheme(for appearance: NativeAppearance) -> ColorScheme? {
        appearance.explicitDark.map { $0 ? ColorScheme.dark : ColorScheme.light }
    }

    private static func adaptive(_ light: UInt32, _ dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: CGFloat((hex >> 16) & 0xFF) / 255,
                           green: CGFloat((hex >> 8) & 0xFF) / 255,
                           blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
        })
    }
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
