import SwiftUI

/// Ellipsis button that opens a report/block action sheet for an opponent.
/// Used in QuestionView (during match) and ResultView (post-match).
struct ReportBlockButton: View {
    @EnvironmentObject var game: GameSocket
    let targetId: String
    let targetName: String

    @State private var showSheet = false
    @State private var toast: String?

    var body: some View {
        Button { showSheet = true } label: {
            Image(systemName: "ellipsis.circle")
                .font(.caption)
                .foregroundColor(Theme.textDim)
        }
        .confirmationDialog(
            game.t("reportBlockTitle"),
            isPresented: $showSheet,
            titleVisibility: .visible
        ) {
            Button(game.t("reportPlayer"), role: .destructive) {
                game.reportUser(
                    targetId: targetId,
                    targetName: targetName,
                    reason: game.t("reportReason")
                )
                showToast(game.t("reportSent"))
            }
            Button(game.t("blockPlayer"), role: .destructive) {
                game.blockUser(targetId: targetId)
                showToast(game.t("playerBlocked"))
            }
            Button(game.t("cancel"), role: .cancel) {}
        } message: {
            Text(game.t("reportBlockMessage"))
        }
        .overlay(toastOverlay)
    }

    @ViewBuilder
    private var toastOverlay: some View {
        if let toast {
            Text(toast)
                .font(.caption2.bold())
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Theme.surface)
                .cornerRadius(6)
                .transition(.opacity)
                .offset(y: -24)
        }
    }

    private func showToast(_ text: String) {
        withAnimation { toast = text }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { toast = nil }
        }
    }
}
