// swift-tools-version: 5.7
import PackageDescription
import Foundation

// Compile only the wire models and deterministic clock. The iOS app keeps its
// normal XcodeGen target, Firebase dependencies and UIKit/SwiftUI sources.
let coreSources = ["Models.swift", "NativeRoundTimeline.swift", "NativeSocialModels.swift"]
let sourceDirectory = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent().appendingPathComponent("Sources/QuizzUp")
let excludedSources = (try? FileManager.default.contentsOfDirectory(atPath: sourceDirectory.path))?
    .filter { !coreSources.contains($0) } ?? []

let package = Package(
    name: "QuizzUpNativeCore",
    platforms: [.macOS(.v12), .iOS(.v16)],
    products: [.library(name: "QuizzUpNativeCore", targets: ["QuizzUpNativeCore"])],
    targets: [
        .target(
            name: "QuizzUpNativeCore",
            path: "Sources/QuizzUp",
            exclude: excludedSources,
            sources: coreSources
        ),
        .testTarget(
            name: "NativeCoreTests",
            dependencies: ["QuizzUpNativeCore"],
            path: "Tests/NativeCoreTests"
        )
    ]
)
