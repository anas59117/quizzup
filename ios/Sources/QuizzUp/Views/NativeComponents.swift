import SwiftUI

struct NativeBrandLogo: View {
    var scale: CGFloat = 1
    var body: some View {
        HStack(spacing: 8 * scale) {
            ZStack {
                Circle().stroke(Color.white, lineWidth: 2.3 * scale).padding(3 * scale)
                NativeLightning().fill(Color.white)
            }.frame(width: 36 * scale, height: 36 * scale)
            Text("QuizzUp").font(.system(size: 27 * scale, weight: .heavy)).tracking(-1.1 * scale)
                .lineLimit(1).fixedSize(horizontal: true, vertical: false)
        }.foregroundColor(.white).accessibilityElement(children: .ignore).accessibilityLabel("QuizzUp")
    }
}

private struct NativeLightning: Shape {
    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / 48
        var path = Path()
        let points: [CGPoint] = [.init(x: 25, y: 9), .init(x: 12, y: 27), .init(x: 24, y: 27), .init(x: 24, y: 39), .init(x: 37, y: 21), .init(x: 25, y: 21)]
        path.addLines(points.map { CGPoint(x: $0.x * scale, y: $0.y * scale) })
        path.closeSubpath()
        return path
    }
}

struct NativePlayerPortrait: View {
    let avatar: String
    var size: CGFloat = 48
    var cornerRadius: CGFloat?
    private var imageName: String {
        "avatar-" + NativeAvatarCatalogue.portraitID(for: avatar)
    }
    var body: some View {
        ZStack {
            Image(imageName).resizable().scaledToFill()
            if avatar.hasPrefix("/profile-photos/") || avatar.hasPrefix("https://"),
               let url = GameSocket.absoluteImageURL(avatar) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() }
                }
            }
        }.frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius ?? size / 2))
            .accessibilityHidden(true)
    }
}

struct NativeAvatarTile: View {
    let option: NativeAvatarCatalogue.Option
    let fr: Bool
    var selected = false
    var highlight = Theme.accent

    var body: some View {
        VStack(spacing: 5) {
            NativePlayerPortrait(avatar: option.id, size: 44, cornerRadius: 12)
            Text(option.label(fr: fr)).font(.caption.weight(.semibold))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, minHeight: 72)
        .padding(.vertical, 5)
        .background(highlight.opacity(selected ? 0.14 : 0.05), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(highlight.opacity(selected ? 1 : 0.24), lineWidth: selected ? 2 : 1))
        .overlay(alignment: .topTrailing) {
            if selected {
                Image(systemName: "checkmark.circle.fill").font(.caption.weight(.semibold))
                    .foregroundColor(highlight).padding(6).accessibilityHidden(true)
            }
        }
        .contentShape(RoundedRectangle(cornerRadius: 12))
    }
}
