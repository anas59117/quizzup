import SwiftUI

struct NativeBrandLogo: View {
    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                Circle().stroke(Color.white, lineWidth: 2.3).padding(3)
                NativeLightning().fill(Color.white)
            }.frame(width: 36, height: 36)
            Text("QuizzUp").font(.system(size: 27, weight: .heavy)).tracking(-1.1)
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
    private var imageName: String {
        let legacy = ["🦊": "fox", "🤖": "robot", "🧠": "brain", "👻": "ghost", "🐱": "cat", "🦉": "owl", "🐉": "dragon"]
        let known = ["fox", "robot", "brain", "astronaut", "ninja", "dragon", "cat", "owl", "ghost", "lion"]
        return "avatar-" + (known.contains(avatar) ? avatar : legacy[avatar] ?? "robot")
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
        }.frame(width: size, height: size).clipShape(Circle()).accessibilityHidden(true)
    }
}
