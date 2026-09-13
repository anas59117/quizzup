import SwiftUI

private let avatars = ["🐺", "🦁", "🦊", "🐼", "🦉", "🐈", "🐯", "🦄"]

struct JoinView: View {
    @EnvironmentObject var game: GameSocket

    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Spacer()
                Button(game.lang == "fr" ? "🇫🇷" : "🇬🇧") { game.toggleLang() }
                    .font(.system(size: 20))
            }
            Spacer()
            Text("⚡ \(game.t("legendBack"))")
                .font(.caption.bold())
                .padding(.horizontal, 14).padding(.vertical, 6)
                .background(Theme.accent)
                .foregroundColor(.white)
                .cornerRadius(20)
            Text("Quizz").font(.system(size: 40, weight: .heavy)) +
            Text("Up").font(.system(size: 40, weight: .heavy)).foregroundColor(Theme.accent)
            Text(game.t("tagline")).foregroundColor(Theme.textDim)

            TextField(game.t("usernamePlaceholder"), text: $game.name)
                .textFieldStyle(.plain)
                .padding()
                .background(Theme.surface)
                .cornerRadius(12)
                .onChange(of: game.name) { new in
                    if new.count > 20 { game.name = String(new.prefix(20)) }
                }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 10) {
                ForEach(avatars, id: \.self) { a in
                    Button(a) { game.avatar = a }
                        .font(.system(size: 22))
                        .frame(width: 48, height: 48)
                        .background(game.avatar == a ? Theme.accent.opacity(0.2) : Theme.surface)
                        .overlay(Circle().stroke(game.avatar == a ? Theme.accent : Theme.border, lineWidth: 2))
                        .clipShape(Circle())
                }
            }

            Button(game.t("continue")) {
                game.persistIdentity()
                game.stage = .home
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(game.name.trimmingCharacters(in: .whitespaces).isEmpty)
            Spacer()
        }
        .padding(24)
    }
}
