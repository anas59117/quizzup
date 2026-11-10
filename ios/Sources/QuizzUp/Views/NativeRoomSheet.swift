import SwiftUI

struct NativeRoomSheet: View {
    enum Mode: Equatable { case create, join }

    @EnvironmentObject private var game: GameSocket
    @Environment(\.dismiss) private var dismiss
    @State private var code = ""
    let category: Category?
    let mode: Mode

    private var fr: Bool { game.lang == "fr" }
    private var title: String {
        if game.privateRoom != nil { return fr ? "Salon privé" : "Private room" }
        if mode == .create { return fr ? "Inviter un ami" : "Invite a friend" }
        return fr ? "J’ai un code" : "I have a code"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text(title).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark").font(.body.weight(.semibold))
                            .foregroundColor(Theme.brand).frame(width: 44, height: 44)
                    }.accessibilityLabel(fr ? "Fermer" : "Close")
                }
                Divider()
                if let room = game.privateRoom {
                    lobby(room)
                } else if mode == .join {
                    Text(fr ? "Entre le code partagé par ton ami." : "Enter the code your friend shared.")
                        .foregroundColor(Theme.muted)
                    TextField(fr ? "Code du salon" : "Room code", text: $code)
                        .textInputAutocapitalization(.characters).autocorrectionDisabled()
                        .font(.title2.monospaced().bold())
                        .padding(14).background(.white, in: RoundedRectangle(cornerRadius: 12))
                        .onChange(of: code) { value in
                            let allowed = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
                            code = String(value.uppercased().filter { allowed.contains($0) }.prefix(5))
                        }
                    Button(fr ? "Rejoindre" : "Join") { game.openPrivateRoom(category: nil, code: code) }
                        .buttonStyle(PrimaryButtonStyle()).disabled(code.count != 5 || game.roomPending)
                } else if !game.roomPending {
                    Button(fr ? "Créer un salon privé" : "Create a private room") {
                        game.openPrivateRoom(category: category?.key)
                    }.buttonStyle(PrimaryButtonStyle())
                }
                if game.roomPending { ProgressView().frame(maxWidth: .infinity) }
                if let error = game.roomError { Text(error).font(.subheadline).foregroundColor(Theme.brand) }
            }
            .padding(20).frame(maxWidth: 560).frame(maxWidth: .infinity)
        }
        .foregroundColor(Theme.ink).tint(Theme.brand)
        .background(Theme.paper.ignoresSafeArea())
        .preferredColorScheme(.light)
        .onAppear {
            game.roomScreenOpen = true
            if mode == .create, game.privateRoom == nil { game.openPrivateRoom(category: category?.key) }
        }
        .onDisappear {
            game.roomScreenOpen = false
            game.leavePrivateRoom()
        }
    }

    private func lobby(_ room: NativePrivateRoom) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(fr ? "Code à partager" : "Code to share").font(.subheadline).foregroundColor(Theme.muted)
            HStack {
                Text(room.code).font(.system(size: 32, weight: .heavy, design: .monospaced))
                    .textSelection(.enabled)
                Spacer()
                ShareLink(item: fr ? "Rejoins-moi sur QuizzUp avec le code \(room.code)" : "Join me on QuizzUp with code \(room.code)") {
                    Label(fr ? "Partager" : "Share", systemImage: "square.and.arrow.up")
                }
            }
            ForEach(room.players) { player in
                HStack(spacing: 10) {
                    NativePlayerPortrait(avatar: player.avatar, size: 38)
                    Text(player.name).font(.subheadline.bold())
                    Spacer()
                    if !player.connected {
                        Text(fr ? "Reconnexion…" : "Reconnecting…").font(.caption).foregroundColor(Theme.muted)
                    }
                }
            }
            if room.isHost {
                Button(fr ? "Lancer la partie" : "Start game") { game.startPrivateRoom(room) }
                    .buttonStyle(PrimaryButtonStyle()).disabled(!room.canStart || game.roomPending)
            } else {
                Text(fr ? "En attente de l’hôte…" : "Waiting for the host…").foregroundColor(Theme.muted)
            }
        }
    }
}
