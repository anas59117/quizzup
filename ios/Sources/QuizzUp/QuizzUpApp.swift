import SwiftUI

@main
struct QuizzUpApp: App {
    @StateObject private var game = GameSocket()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(game)
                .preferredColorScheme(.dark)
        }
    }
}
