import SwiftUI

/// Ellipsis button that opens a report/block action sheet for an opponent.
/// Used in QuestionView (during match) and ResultView (post-match).
struct ReportBlockButton: View {
    @EnvironmentObject var game: GameSocket
    let targetId: String
    let targetName: String
    var foreground: Color = Theme.textDim

    @State private var showSheet = false
    @State private var toast: String?
    @State private var busy = false

    var body: some View {
        Button { showSheet = true } label: {
            Image(systemName: "ellipsis.circle")
                .font(.caption)
                .foregroundColor(foreground)
                .frame(width: 44, height: 44).contentShape(Rectangle())
        }
        .disabled(busy)
        .accessibilityLabel(game.t("reportBlockTitle"))
        .confirmationDialog(
            game.t("reportBlockTitle"),
            isPresented: $showSheet,
            titleVisibility: .visible
        ) {
            Button(game.t("reportPlayer"), role: .destructive) {
                perform {
                    try await game.reportUser(targetId: targetId, targetName: targetName, reason: game.t("reportReason"))
                    return game.t("reportSent")
                }
            }
            Button(game.t("blockPlayer"), role: .destructive) {
                perform { try await game.blockUser(targetId: targetId); return game.t("playerBlocked") }
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
                .foregroundColor(.white)
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

    private func perform(_ action: @escaping () async throws -> String) {
        guard !busy else { return }
        busy = true
        Task {
            do { showToast(try await action()) }
            catch { showToast(game.t("serverUnreachable")) }
            busy = false
        }
    }
}
