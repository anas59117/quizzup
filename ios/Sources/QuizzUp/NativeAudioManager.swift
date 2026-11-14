import AVFoundation
import SwiftUI

/// One app-wide player: changing rounds keeps the duel score running.
@MainActor
final class NativeAudioManager: NSObject, ObservableObject {
    @Published private(set) var isMuted: Bool
    private var policy: NativeAudioPolicy
    private var music: [NativeMusicCue: AVAudioPlayer] = [:]
    private var effects: [NativeSoundCue: AVAudioPlayer] = [:]
    private var pendingStops: [NativeMusicCue: DispatchWorkItem] = [:]
    private var currentCue: NativeMusicCue?
    private var sessionReady = false
    private let session = AVAudioSession.sharedInstance()
    private static let preferenceKey = "quizzup.audioMuted"

    override init() {
        var muted = StoreCaptureConfiguration.enabled ? false : UserDefaults.standard.bool(forKey: Self.preferenceKey)
        #if DEBUG && STORE_CAPTURE
        if StoreCaptureConfiguration.options?.screen == "question-muted" { muted = true }
        #endif
        isMuted = muted
        policy = NativeAudioPolicy(muted: muted)
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(interruption),
                                              name: AVAudioSession.interruptionNotification, object: session)
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged),
                                              name: AVAudioSession.routeChangeNotification, object: session)
        NotificationCenter.default.addObserver(self, selector: #selector(mediaReset),
                                              name: AVAudioSession.mediaServicesWereResetNotification, object: session)
        #if DEBUG && STORE_CAPTURE
        if StoreCaptureConfiguration.enabled {
            do { try session.setCategory(.ambient, mode: .default) }
            catch { preconditionFailure("Audio session category is unsupported") }
            for name in [NativeMusicCue.search.rawValue, NativeMusicCue.duel.rawValue, "correct", "wrong"] {
                guard let player = Self.player(named: name), player.duration > 0 else {
                    preconditionFailure("Missing or unreadable bundled audio: \(name)")
                }
            }
        }
        #endif
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    func setMuted(_ muted: Bool) {
        isMuted = muted
        policy.muted = muted
        if !muted { policy.interrupted = false }
        if !StoreCaptureConfiguration.enabled { UserDefaults.standard.set(muted, forKey: Self.preferenceKey) }
        applyPlayback()
    }

    func setContext(_ cue: NativeMusicCue?) {
        if policy.desired != cue, let cue { music[cue]?.currentTime = 0 }
        policy.desired = cue
        applyPlayback(softStop: true)
    }

    func setForeground(_ foreground: Bool) {
        policy.foreground = foreground
        applyPlayback()
    }

    func playFeedback(_ feedback: NativeAnswerFeedback) {
        guard let cue = policy.consume(feedback), activateSession() else { return }
        if effects[cue] == nil { effects[cue] = Self.player(named: cue.rawValue) }
        guard let player = effects[cue] else { return }
        player.currentTime = 0
        player.volume = 0.65
        player.play()
    }

    private func activateSession() -> Bool {
        if sessionReady { return true }
        do {
            // Ambient respects the phone's silent switch and doesn't stop other audio apps.
            try session.setCategory(.ambient, mode: .default)
            try session.setActive(true)
            sessionReady = true
            return true
        } catch { return false }
    }

    private func applyPlayback(softStop: Bool = false) {
        guard let cue = policy.playableCue else {
            effects.values.forEach { $0.stop() }
            stopMusic(soft: softStop && policy.foreground && !policy.muted && !policy.interrupted)
            return
        }
        guard activateSession() else { stopMusic(soft: false); return }
        if currentCue == cue, music[cue]?.isPlaying == true { return }
        for other in music.keys where other != cue { fadeOut(other, soft: true) }
        pendingStops[cue]?.cancel(); pendingStops[cue] = nil
        if music[cue] == nil { music[cue] = Self.player(named: cue.rawValue) }
        guard let player = music[cue] else { return }
        player.numberOfLoops = -1
        player.volume = 0
        currentCue = cue
        if player.play() { player.setVolume(0.22, fadeDuration: 0.45) }
        else { currentCue = nil }
    }

    private func stopMusic(soft: Bool) {
        currentCue = nil
        for cue in music.keys { fadeOut(cue, soft: soft) }
        if !soft { deactivateSession() }
    }

    private func fadeOut(_ cue: NativeMusicCue, soft: Bool) {
        pendingStops[cue]?.cancel(); pendingStops[cue] = nil
        guard let player = music[cue] else { return }
        guard soft, player.isPlaying else { player.pause(); player.volume = 0; return }
        player.setVolume(0, fadeDuration: 0.35)
        let stop = DispatchWorkItem { [weak self, weak player] in
            guard let self, self.currentCue != cue else { return }
            player?.pause()
            self.pendingStops[cue] = nil
            if self.currentCue == nil, !self.music.values.contains(where: \.isPlaying) { self.deactivateSession() }
        }
        pendingStops[cue] = stop
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4, execute: stop)
    }

    private func deactivateSession() {
        guard sessionReady else { return }
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
        sessionReady = false
    }

    private static func player(named name: String) -> AVAudioPlayer? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "mp3"),
              let player = try? AVAudioPlayer(contentsOf: url) else { return nil }
        player.prepareToPlay()
        return player
    }

    @objc nonisolated private func interruption(_ notification: Notification) {
        guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
        Task { @MainActor [weak self] in
            guard let self else { return }
            if type == .began {
                self.policy.interrupted = true
                self.sessionReady = false
            } else {
                self.policy.interrupted = !AVAudioSession.InterruptionOptions(rawValue: rawOptions).contains(.shouldResume)
            }
            self.applyPlayback()
        }
    }

    @objc nonisolated private func routeChanged(_ notification: Notification) {
        guard let raw = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              AVAudioSession.RouteChangeReason(rawValue: raw) == .oldDeviceUnavailable else { return }
        Task { @MainActor [weak self] in self?.setMuted(true) }
    }

    @objc nonisolated private func mediaReset(_ notification: Notification) {
        Task { @MainActor [weak self] in
            guard let self else { return }
            self.pendingStops.values.forEach { $0.cancel() }; self.pendingStops.removeAll()
            self.music.removeAll(); self.effects.removeAll(); self.currentCue = nil; self.sessionReady = false
            self.applyPlayback()
        }
    }
}

struct NativeAudioToggle: View {
    @EnvironmentObject private var game: GameSocket
    @EnvironmentObject private var audio: NativeAudioManager
    var body: some View {
        Button { audio.setMuted(!audio.isMuted) } label: {
            Image(systemName: audio.isMuted ? "speaker.slash" : "speaker.wave.2")
                .font(.system(size: 17, weight: .medium)).foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 13))
                .overlay(RoundedRectangle(cornerRadius: 13).strokeBorder(.white.opacity(0.16)))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(game.lang == "fr" ? (audio.isMuted ? "Activer le son" : "Couper le son") : (audio.isMuted ? "Unmute" : "Mute"))
        .accessibilityValue(game.lang == "fr" ? (audio.isMuted ? "Son coupé" : "Son activé") : (audio.isMuted ? "Sound off" : "Sound on"))
    }
}
