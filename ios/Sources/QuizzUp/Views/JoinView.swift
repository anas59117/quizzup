import SwiftUI

struct JoinView: View {
    @EnvironmentObject var game: GameSocket
    private var fr: Bool { game.lang == "fr" }
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                HStack {
                    NativeBrandLogo()
                    Spacer()
                    Button(game.lang.uppercased()) { game.toggleLang() }
                        .font(.subheadline.bold()).frame(minWidth: 44, minHeight: 44)
                        .accessibilityLabel(fr ? "Changer la langue" : "Change language")
                }.padding(.bottom, 32)
                NativePlayerPortrait(avatar: game.avatar, size: 88)
                Text(fr ? "Prêt à faire ton retour ?" : "Ready for your comeback?")
                    .font(.system(size: 30, weight: .bold)).multilineTextAlignment(.center)
                Text(fr ? "Choisis le nom que tes adversaires verront." : "Choose the name your opponents will see.")
                    .font(.body).multilineTextAlignment(.center)
                TextField(game.t("usernamePlaceholder"), text: $game.name)
                    .textFieldStyle(.plain).textContentType(.nickname).autocorrectionDisabled()
                    .padding(18).background(Theme.paper).foregroundColor(Theme.ink).cornerRadius(16)
                    .tint(Theme.brand)
                    .onChange(of: game.name) { value in if value.count > 20 { game.name = String(value.prefix(20)) } }
                if let error = game.socialError { Text(error).font(.subheadline).multilineTextAlignment(.center) }
                Button {
                    game.completeProfile()
                } label: {
                    HStack {
                        if game.profileSaving { ProgressView().tint(Theme.ink) }
                        Text(game.t("continue")).font(.headline)
                    }.frame(maxWidth: .infinity, minHeight: 56)
                }.background(Theme.gold).foregroundColor(Theme.ink).cornerRadius(16)
                    .disabled(game.profileSaving || game.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                Link(game.t("privacyPolicy"), destination: URL(string: "https://\(GameSocket.frontendHost)/privacy.html")!)
                    .font(.footnote).padding(.top, 12)
            }.foregroundColor(.white).padding(24).frame(maxWidth: 520).frame(maxWidth: .infinity)
        }.background(Theme.brand.ignoresSafeArea()).tint(.white)
    }
}
