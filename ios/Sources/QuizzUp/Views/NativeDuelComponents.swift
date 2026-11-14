import SwiftUI

enum NativeDuelColors {
    static let introCanvas = Color(hex: 0x0A0A0A)
    static let atlasPaper = Color(hex: 0xF4F2EB)
    static let atlasGold = Color(hex: 0xF4CD62)
    static let arena = Color(hex: 0x111312)
    static let secondary = Color(hex: 0xC3C6C3)
    static let mine = Color(hex: 0x55C4EF)
    static let other = Color(hex: 0xE7955A)
    static let correct = Color(hex: 0x77EFAF)
    static let wrong = Color(hex: 0xFFADB6)
}

enum NativeDuelAnswerState { case waiting, submitted, correct, wrong, timeout }

struct NativeDuelPlayer: View {
    @ScaledMetric(relativeTo: .title2) private var scoreSize: CGFloat = 25
    let avatar: String
    let name: String
    let score: Int
    let color: Color
    let state: NativeDuelAnswerState
    let status: String
    var trailing = false
    var compact = false
    var stacked = false

    var body: some View {
        VStack(alignment: stacked ? .center : trailing ? .trailing : .leading, spacing: 4) {
            if stacked {
                portrait
                identity
            } else {
                HStack(spacing: compact ? 5 : 8) {
                    if !trailing { portrait }
                    identity
                    if trailing { portrait }
                }
            }
            Text(status).font(.caption2).lineLimit(1).foregroundColor(statusColor)
        }
        .frame(maxWidth: .infinity, alignment: stacked ? .center : trailing ? .trailing : .leading)
        .accessibilityElement(children: .combine)
    }

    private var identity: some View {
        VStack(alignment: stacked ? .center : trailing ? .trailing : .leading, spacing: 0) {
            Text(name).font(.caption.weight(.semibold)).lineLimit(1)
            Text("\(score)").font(.system(size: scoreSize * (compact ? 0.84 : 1), weight: .bold))
                .monospacedDigit().foregroundColor(color)
        }
    }

    private var portrait: some View {
        NativePlayerPortrait(avatar: avatar, size: compact || stacked ? 32 : 44)
            .padding(compact || stacked ? 3 : 4)
            .overlay(Circle().strokeBorder(color, lineWidth: compact || stacked ? 2 : 3))
            .overlay(alignment: .topTrailing) {
                if let mark {
                    Text(mark).font(.system(size: 11, weight: .heavy))
                        .foregroundColor(state == .correct ? NativeDuelColors.arena : .white)
                        .frame(width: 18, height: 18)
                        .background(markBackground, in: Circle())
                        .overlay(Circle().strokeBorder(NativeDuelColors.arena, lineWidth: 2))
                        .offset(x: 3, y: -3)
                        .accessibilityHidden(true)
                }
            }
    }

    private var mark: String? {
        switch state {
        case .waiting: return nil
        case .submitted: return "•"
        case .correct: return "✓"
        case .wrong: return "✕"
        case .timeout: return "–"
        }
    }

    private var markBackground: Color {
        switch state {
        case .correct: return NativeDuelColors.correct
        case .wrong: return Color(hex: 0xC81E3A)
        default: return Color(hex: 0x484B48)
        }
    }

    private var statusColor: Color {
        switch state {
        case .correct: return NativeDuelColors.correct
        case .wrong: return NativeDuelColors.wrong
        default: return NativeDuelColors.secondary
        }
    }
}

struct NativeDuelTimer: View {
    let seconds: Int
    let limit: Int
    let revealing: Bool
    var compact = false

    var body: some View {
        ZStack {
            Circle().strokeBorder(Color(hex: 0x454845), lineWidth: 4)
            Circle().inset(by: 2)
                .trim(from: 0, to: revealing ? 1 : min(1, max(0, Double(seconds) / Double(max(1, limit)))))
                .stroke(Color(hex: 0xF4EFE4), lineWidth: 4)
                .rotationEffect(.degrees(-90))
            if revealing { Image(systemName: "checkmark").font(.title2.weight(.bold)) }
            else { Text("\(seconds)").font(.system(size: compact ? 22 : 27, weight: .bold)).monospacedDigit() }
        }
        .frame(width: compact ? 42 : 54, height: compact ? 42 : 54)
        .accessibilityElement(children: .ignore)
        .accessibilityValue(revealing ? "✓" : "\(seconds)")
    }
}

struct NativeScoreRail: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let score: Int
    let maximum: Int
    let color: Color

    var body: some View {
        GeometryReader { geometry in
            Capsule().fill(Color(hex: 0x353936))
                .overlay(alignment: .bottom) {
                    Capsule().fill(color)
                        .frame(height: geometry.size.height * CGFloat(min(1, max(0, Double(score) / Double(max(1, maximum))))))
                }
        }
        .frame(width: 8).accessibilityHidden(true).allowsHitTesting(false)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.55), value: score)
    }
}

struct NativeDuelActionStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    var prominent = true
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(prominent ? .headline.weight(.bold) : .subheadline.weight(.semibold))
            .multilineTextAlignment(.center)
            .foregroundColor(prominent ? Color(hex: 0xC81E3A) : .white)
            .padding(.horizontal, 8).padding(.vertical, 10)
            .frame(maxWidth: .infinity, minHeight: prominent ? 54 : 48)
            .background(prominent ? Color.white : Color.white.opacity(0.10), in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Color.white.opacity(prominent ? 0 : 0.35)))
            .contentShape(RoundedRectangle(cornerRadius: 16))
            .opacity(!isEnabled ? 0.5 : configuration.isPressed ? 0.8 : 1)
    }
}

// The same simplified coastlines as the website's MatchPresentation.SearchWorld.
// Decorative illustration only; it never implies a player's location.
struct NativeSearchWorld: Shape {
    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width / 1000, rect.height / 560)
        let offset = CGPoint(x: rect.midX - 500 * scale, y: rect.midY - 280 * scale)
        var path = Path()
        for polygon in Self.continents {
            guard let first = polygon.first else { continue }
            path.move(to: CGPoint(x: offset.x + first.x * scale, y: offset.y + first.y * scale))
            for point in polygon.dropFirst() {
                path.addLine(to: CGPoint(x: offset.x + point.x * scale, y: offset.y + point.y * scale))
            }
            path.closeSubpath()
        }
        return path
    }
    private static let continents: [[CGPoint]] = [
        [CGPoint(x: 62, y: 144), CGPoint(x: 82, y: 124), CGPoint(x: 112, y: 117), CGPoint(x: 124, y: 99), CGPoint(x: 155, y: 97), CGPoint(x: 161, y: 84), CGPoint(x: 194, y: 87), CGPoint(x: 208, y: 106), CGPoint(x: 236, y: 111), CGPoint(x: 257, y: 125), CGPoint(x: 275, y: 124), CGPoint(x: 285, y: 140), CGPoint(x: 275, y: 153), CGPoint(x: 261, y: 157), CGPoint(x: 258, y: 178), CGPoint(x: 245, y: 191), CGPoint(x: 238, y: 216), CGPoint(x: 223, y: 229), CGPoint(x: 209, y: 238), CGPoint(x: 207, y: 253), CGPoint(x: 196, y: 251), CGPoint(x: 185, y: 233), CGPoint(x: 166, y: 229), CGPoint(x: 156, y: 216), CGPoint(x: 146, y: 204), CGPoint(x: 132, y: 201), CGPoint(x: 124, y: 185), CGPoint(x: 110, y: 175), CGPoint(x: 106, y: 154), CGPoint(x: 91, y: 149), CGPoint(x: 82, y: 160), CGPoint(x: 66, y: 161), CGPoint(x: 55, y: 153)],
        [CGPoint(x: 158, y: 218), CGPoint(x: 168, y: 234), CGPoint(x: 182, y: 248), CGPoint(x: 200, y: 256), CGPoint(x: 210, y: 274), CGPoint(x: 226, y: 281), CGPoint(x: 234, y: 291), CGPoint(x: 248, y: 294), CGPoint(x: 259, y: 306), CGPoint(x: 271, y: 307), CGPoint(x: 274, y: 316), CGPoint(x: 257, y: 313), CGPoint(x: 242, y: 301), CGPoint(x: 222, y: 295), CGPoint(x: 211, y: 285), CGPoint(x: 195, y: 280), CGPoint(x: 184, y: 267), CGPoint(x: 169, y: 262), CGPoint(x: 156, y: 237)],
        [CGPoint(x: 203, y: 82), CGPoint(x: 217, y: 62), CGPoint(x: 239, y: 65), CGPoint(x: 246, y: 80), CGPoint(x: 235, y: 94), CGPoint(x: 216, y: 93)],
        [CGPoint(x: 241, y: 89), CGPoint(x: 257, y: 76), CGPoint(x: 274, y: 81), CGPoint(x: 279, y: 99), CGPoint(x: 260, y: 104)],
        [CGPoint(x: 196, y: 58), CGPoint(x: 212, y: 45), CGPoint(x: 224, y: 54), CGPoint(x: 220, y: 66)],
        [CGPoint(x: 254, y: 67), CGPoint(x: 269, y: 44), CGPoint(x: 297, y: 52), CGPoint(x: 302, y: 67), CGPoint(x: 280, y: 76)],
        [CGPoint(x: 280, y: 106), CGPoint(x: 294, y: 87), CGPoint(x: 315, y: 91), CGPoint(x: 313, y: 107), CGPoint(x: 295, y: 118)],
        [CGPoint(x: 311, y: 58), CGPoint(x: 346, y: 38), CGPoint(x: 389, y: 42), CGPoint(x: 409, y: 56), CGPoint(x: 404, y: 79), CGPoint(x: 381, y: 91), CGPoint(x: 374, y: 116), CGPoint(x: 351, y: 138), CGPoint(x: 339, y: 130), CGPoint(x: 334, y: 103), CGPoint(x: 317, y: 87)],
        [CGPoint(x: 268, y: 304), CGPoint(x: 288, y: 295), CGPoint(x: 309, y: 300), CGPoint(x: 323, y: 313), CGPoint(x: 346, y: 319), CGPoint(x: 358, y: 333), CGPoint(x: 384, y: 342), CGPoint(x: 391, y: 360), CGPoint(x: 380, y: 385), CGPoint(x: 367, y: 398), CGPoint(x: 359, y: 428), CGPoint(x: 343, y: 448), CGPoint(x: 336, y: 472), CGPoint(x: 319, y: 491), CGPoint(x: 313, y: 514), CGPoint(x: 298, y: 509), CGPoint(x: 289, y: 486), CGPoint(x: 286, y: 462), CGPoint(x: 275, y: 442), CGPoint(x: 271, y: 415), CGPoint(x: 255, y: 393), CGPoint(x: 248, y: 367), CGPoint(x: 254, y: 345), CGPoint(x: 247, y: 326)],
        [CGPoint(x: 239, y: 278), CGPoint(x: 261, y: 275), CGPoint(x: 279, y: 281), CGPoint(x: 275, y: 286), CGPoint(x: 252, y: 284)],
        [CGPoint(x: 287, y: 292), CGPoint(x: 301, y: 290), CGPoint(x: 309, y: 295), CGPoint(x: 299, y: 298)],
        [CGPoint(x: 309, y: 298), CGPoint(x: 320, y: 299), CGPoint(x: 322, y: 306), CGPoint(x: 315, y: 307)],
        [CGPoint(x: 439, y: 151), CGPoint(x: 450, y: 142), CGPoint(x: 451, y: 124), CGPoint(x: 463, y: 117), CGPoint(x: 472, y: 127), CGPoint(x: 466, y: 140), CGPoint(x: 472, y: 148), CGPoint(x: 464, y: 158), CGPoint(x: 449, y: 159), CGPoint(x: 441, y: 167), CGPoint(x: 432, y: 162)],
        [CGPoint(x: 464, y: 171), CGPoint(x: 478, y: 160), CGPoint(x: 482, y: 142), CGPoint(x: 494, y: 131), CGPoint(x: 500, y: 104), CGPoint(x: 520, y: 84), CGPoint(x: 532, y: 87), CGPoint(x: 523, y: 108), CGPoint(x: 513, y: 128), CGPoint(x: 505, y: 135), CGPoint(x: 507, y: 152), CGPoint(x: 526, y: 145), CGPoint(x: 543, y: 147), CGPoint(x: 548, y: 162), CGPoint(x: 535, y: 172), CGPoint(x: 522, y: 171), CGPoint(x: 510, y: 183), CGPoint(x: 493, y: 184), CGPoint(x: 485, y: 197), CGPoint(x: 468, y: 196), CGPoint(x: 464, y: 186), CGPoint(x: 447, y: 188), CGPoint(x: 438, y: 176)],
        [CGPoint(x: 482, y: 189), CGPoint(x: 498, y: 192), CGPoint(x: 506, y: 208), CGPoint(x: 519, y: 217), CGPoint(x: 516, y: 226), CGPoint(x: 503, y: 221), CGPoint(x: 496, y: 206), CGPoint(x: 486, y: 203)],
        [CGPoint(x: 516, y: 183), CGPoint(x: 529, y: 187), CGPoint(x: 533, y: 200), CGPoint(x: 544, y: 206), CGPoint(x: 540, y: 215), CGPoint(x: 526, y: 207), CGPoint(x: 523, y: 194), CGPoint(x: 513, y: 191)],
        [CGPoint(x: 423, y: 113), CGPoint(x: 436, y: 107), CGPoint(x: 449, y: 113), CGPoint(x: 444, y: 121), CGPoint(x: 427, y: 122)],
        [CGPoint(x: 419, y: 175), CGPoint(x: 426, y: 166), CGPoint(x: 430, y: 171), CGPoint(x: 428, y: 184), CGPoint(x: 420, y: 187)],
        [CGPoint(x: 466, y: 216), CGPoint(x: 491, y: 211), CGPoint(x: 519, y: 217), CGPoint(x: 534, y: 229), CGPoint(x: 552, y: 231), CGPoint(x: 562, y: 253), CGPoint(x: 579, y: 270), CGPoint(x: 601, y: 272), CGPoint(x: 589, y: 292), CGPoint(x: 571, y: 303), CGPoint(x: 566, y: 334), CGPoint(x: 551, y: 351), CGPoint(x: 547, y: 375), CGPoint(x: 533, y: 398), CGPoint(x: 514, y: 402), CGPoint(x: 503, y: 385), CGPoint(x: 500, y: 362), CGPoint(x: 488, y: 341), CGPoint(x: 483, y: 317), CGPoint(x: 465, y: 310), CGPoint(x: 451, y: 291), CGPoint(x: 447, y: 271), CGPoint(x: 456, y: 246)],
        [CGPoint(x: 589, y: 351), CGPoint(x: 598, y: 335), CGPoint(x: 605, y: 339), CGPoint(x: 603, y: 361), CGPoint(x: 593, y: 377), CGPoint(x: 585, y: 369)],
        [CGPoint(x: 557, y: 218), CGPoint(x: 572, y: 213), CGPoint(x: 585, y: 224), CGPoint(x: 603, y: 230), CGPoint(x: 613, y: 251), CGPoint(x: 596, y: 263), CGPoint(x: 581, y: 258), CGPoint(x: 569, y: 240)],
        [CGPoint(x: 536, y: 146), CGPoint(x: 553, y: 131), CGPoint(x: 554, y: 112), CGPoint(x: 577, y: 97), CGPoint(x: 604, y: 101), CGPoint(x: 613, y: 87), CGPoint(x: 642, y: 80), CGPoint(x: 657, y: 89), CGPoint(x: 678, y: 81), CGPoint(x: 701, y: 88), CGPoint(x: 721, y: 76), CGPoint(x: 750, y: 88), CGPoint(x: 775, y: 83), CGPoint(x: 790, y: 94), CGPoint(x: 817, y: 95), CGPoint(x: 834, y: 107), CGPoint(x: 862, y: 106), CGPoint(x: 883, y: 123), CGPoint(x: 907, y: 125), CGPoint(x: 926, y: 142), CGPoint(x: 950, y: 143), CGPoint(x: 963, y: 158), CGPoint(x: 956, y: 172), CGPoint(x: 933, y: 173), CGPoint(x: 917, y: 162), CGPoint(x: 902, y: 167), CGPoint(x: 885, y: 158), CGPoint(x: 872, y: 168), CGPoint(x: 854, y: 166), CGPoint(x: 845, y: 181), CGPoint(x: 830, y: 186), CGPoint(x: 826, y: 205), CGPoint(x: 811, y: 218), CGPoint(x: 800, y: 212), CGPoint(x: 786, y: 223), CGPoint(x: 766, y: 217), CGPoint(x: 749, y: 225), CGPoint(x: 737, y: 244), CGPoint(x: 722, y: 247), CGPoint(x: 717, y: 270), CGPoint(x: 703, y: 283), CGPoint(x: 697, y: 312), CGPoint(x: 686, y: 303), CGPoint(x: 679, y: 277), CGPoint(x: 665, y: 262), CGPoint(x: 660, y: 239), CGPoint(x: 641, y: 243), CGPoint(x: 624, y: 233), CGPoint(x: 614, y: 213), CGPoint(x: 597, y: 210), CGPoint(x: 589, y: 194), CGPoint(x: 572, y: 199), CGPoint(x: 564, y: 186), CGPoint(x: 543, y: 182), CGPoint(x: 536, y: 163), CGPoint(x: 522, y: 158)],
        [CGPoint(x: 699, y: 249), CGPoint(x: 712, y: 257), CGPoint(x: 719, y: 279), CGPoint(x: 733, y: 292), CGPoint(x: 738, y: 316), CGPoint(x: 751, y: 325), CGPoint(x: 758, y: 342), CGPoint(x: 747, y: 349), CGPoint(x: 735, y: 333), CGPoint(x: 728, y: 312), CGPoint(x: 713, y: 304), CGPoint(x: 705, y: 281), CGPoint(x: 696, y: 267)],
        [CGPoint(x: 792, y: 211), CGPoint(x: 803, y: 216), CGPoint(x: 800, y: 233), CGPoint(x: 789, y: 240), CGPoint(x: 785, y: 228)],
        [CGPoint(x: 830, y: 190), CGPoint(x: 836, y: 174), CGPoint(x: 845, y: 172), CGPoint(x: 844, y: 191), CGPoint(x: 832, y: 204), CGPoint(x: 824, y: 202)],
        [CGPoint(x: 839, y: 161), CGPoint(x: 845, y: 142), CGPoint(x: 856, y: 133), CGPoint(x: 861, y: 140), CGPoint(x: 849, y: 164)],
        [CGPoint(x: 771, y: 291), CGPoint(x: 780, y: 301), CGPoint(x: 781, y: 319), CGPoint(x: 789, y: 332), CGPoint(x: 782, y: 340), CGPoint(x: 772, y: 328), CGPoint(x: 767, y: 306)],
        [CGPoint(x: 803, y: 322), CGPoint(x: 814, y: 328), CGPoint(x: 820, y: 343), CGPoint(x: 809, y: 347), CGPoint(x: 803, y: 336)],
        [CGPoint(x: 725, y: 348), CGPoint(x: 745, y: 353), CGPoint(x: 762, y: 363), CGPoint(x: 758, y: 370), CGPoint(x: 738, y: 364)],
        [CGPoint(x: 764, y: 371), CGPoint(x: 795, y: 372), CGPoint(x: 808, y: 377), CGPoint(x: 803, y: 384), CGPoint(x: 771, y: 380)],
        [CGPoint(x: 794, y: 346), CGPoint(x: 804, y: 350), CGPoint(x: 811, y: 365), CGPoint(x: 805, y: 370), CGPoint(x: 794, y: 359)],
        [CGPoint(x: 819, y: 369), CGPoint(x: 834, y: 361), CGPoint(x: 858, y: 366), CGPoint(x: 873, y: 378), CGPoint(x: 864, y: 388), CGPoint(x: 846, y: 381), CGPoint(x: 828, y: 382)],
        [CGPoint(x: 802, y: 410), CGPoint(x: 826, y: 395), CGPoint(x: 850, y: 392), CGPoint(x: 862, y: 375), CGPoint(x: 875, y: 382), CGPoint(x: 882, y: 402), CGPoint(x: 900, y: 409), CGPoint(x: 910, y: 430), CGPoint(x: 903, y: 456), CGPoint(x: 890, y: 469), CGPoint(x: 868, y: 466), CGPoint(x: 848, y: 475), CGPoint(x: 826, y: 470), CGPoint(x: 815, y: 457), CGPoint(x: 793, y: 454), CGPoint(x: 788, y: 437)],
        [CGPoint(x: 871, y: 483), CGPoint(x: 883, y: 481), CGPoint(x: 888, y: 492), CGPoint(x: 879, y: 500), CGPoint(x: 871, y: 495)],
        [CGPoint(x: 936, y: 439), CGPoint(x: 943, y: 445), CGPoint(x: 938, y: 464), CGPoint(x: 927, y: 476), CGPoint(x: 921, y: 470), CGPoint(x: 931, y: 455)],
        [CGPoint(x: 923, y: 476), CGPoint(x: 930, y: 483), CGPoint(x: 919, y: 498), CGPoint(x: 902, y: 507), CGPoint(x: 896, y: 501)],
    ]
}
