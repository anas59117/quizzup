import SwiftUI

struct HomeView: View {
    @EnvironmentObject var game: GameSocket
    @EnvironmentObject var auth: AuthManager
    @State private var showDeleteConfirm = false
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 12), count: 3)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    VStack(alignment: .leading) {
                        Text("\(game.t("hey", ["name": game.name])) 👋").font(.caption).foregroundColor(Theme.textDim)
                        (Text("Quizz").font(.title2.bold()) + Text("Up").font(.title2.bold()).foregroundColor(Theme.accent))
                    }
                    Spacer()
                    Button {
                        auth.signOut()
                        game.resetForSignOut()
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                    .font(.system(size: 16))
                    .foregroundColor(Theme.textDim)
                    Button(game.lang == "fr" ? "🇫🇷" : "🇬🇧") { game.toggleLang() }
                        .font(.system(size: 18))
                    Text(game.avatar).font(.system(size: 20))
                        .frame(width: 40, height: 40)
                        .background(Theme.accent)
                        .clipShape(Circle())
                }

                Button {
                    game.soloMode.toggle()
                } label: {
                    Text(game.soloMode ? "🧍 \(game.t("solo"))" : "👥 \(game.t("multiplayer"))")
                        .font(.caption.bold())
                        .padding(.horizontal, 14).padding(.vertical, 6)
                        .background(game.soloMode ? Theme.accent : Theme.surface)
                        .foregroundColor(game.soloMode ? .white : Theme.textDim)
                        .cornerRadius(20)
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Theme.border, lineWidth: game.soloMode ? 0 : 1))
                }
                .frame(maxWidth: .infinity, alignment: .trailing)

                Button { game.quickMatch() } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("⚡ \(game.t("quickPlay"))").font(.headline.bold())
                            Text(game.t("randomTopic")).font(.caption).opacity(0.8)
                        }
                        Spacer()
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(Theme.accent)
                    .cornerRadius(14)
                    .opacity(game.isStarting ? 0.6 : 1)
                }
                .disabled(game.isStarting)

                Text("🔥 \(game.t("allThemes"))").font(.caption.bold()).foregroundColor(Theme.textDim)

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(game.categories) { c in
                        Button { game.startWithCategory(c.key) } label: {
                            VStack(spacing: 6) {
                                Text(c.icon).font(.system(size: 26))
                                    .frame(width: 56, height: 56)
                                    .background(Theme.surface2)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                                Text(c.label).font(.caption2.bold())
                                    .foregroundColor(Theme.text)
                                    .multilineTextAlignment(.center)
                                    .lineLimit(2)
                            }
                        }
                    }
                }
                .disabled(game.isStarting)
                .opacity(game.isStarting ? 0.6 : 1)
            }
                // Account deletion — App Store Guideline 5.1.1(v)
                Button {
                    showDeleteConfirm = true
                } label: {
                    Text(game.t("deleteAccount"))
                        .font(.caption)
                        .foregroundColor(.red.opacity(0.8))
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 16)
                .disabled(auth.isDeletingAccount)

                if let error = auth.deleteError {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .padding(20)
        }
        .onAppear { if game.categories.isEmpty { game.loadCategories() } }
        .alert(
            game.t("deleteAccountConfirmTitle"),
            isPresented: $showDeleteConfirm
        ) {
            Button(game.t("cancel"), role: .cancel) {}
            Button(game.t("deleteAccountConfirm"), role: .destructive) {
                Task {
                    await auth.deleteAccount()
                    if auth.user == nil { game.resetForSignOut() }
                }
            }
        } message: {
            Text(game.t("deleteAccountConfirmMessage"))
        }
        .overlay {
            if auth.isDeletingAccount {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .overlay(ProgressView().tint(.white))
            }
        }
    }
}
