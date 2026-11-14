import PhotosUI
import SwiftUI

struct NativeCommunityComposer: View {
    @EnvironmentObject private var game: GameSocket
    @EnvironmentObject private var auth: AuthManager
    @Environment(\.dismiss) private var dismiss
    @State private var topic = ""
    @State private var draft = ""
    @State private var photo: PhotosPickerItem?
    @State private var photoURL: String?
    @State private var uploading = false
    @State private var photoError = false
    @State private var includesQuestion = false
    @State private var prompt = ""
    @State private var answers = Array(repeating: "", count: 4)
    @State private var correct = 0
    private var fr: Bool { game.lang == "fr" }
    init(initialTopic: String?, initialText: String = "") {
        _topic = State(initialValue: initialTopic ?? "")
        _draft = State(initialValue: String(initialText.prefix(240)))
    }
    private var questionReady: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && answers.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    var body: some View {
        NavigationStack {
            Form {
                Picker(fr ? "Thème" : "Topic", selection: $topic) {
                    Text(fr ? "Aucun thème" : "No topic").tag("")
                    ForEach(game.categories) { item in
                        Text(NativeCatalog.title(for: item, lang: game.lang)).tag(item.key)
                    }
                }
                TextField(fr ? "Ton message" : "Your message", text: $draft, axis: .vertical)
                    .lineLimit(4...8).onChange(of: draft) { draft = String($0.prefix(240)) }
                PhotosPicker(selection: $photo, matching: .images) {
                    Label(photoURL == nil ? (fr ? "Ajouter une photo" : "Add a photo") : (fr ? "Changer la photo" : "Change photo"), systemImage: "photo")
                }.disabled(uploading || game.community.publishing)
                if uploading { ProgressView() }
                if photoError { Text(fr ? "La photo n’a pas pu être chargée." : "The photo could not be uploaded.") }
                Toggle(fr ? "Ajouter un mini-quiz" : "Add a mini quiz", isOn: $includesQuestion)
                if includesQuestion {
                    TextField(fr ? "Question" : "Question", text: $prompt)
                    ForEach(answers.indices, id: \.self) { index in
                        TextField("\(fr ? "Réponse" : "Answer") \(index + 1)", text: $answers[index])
                    }
                    Picker(fr ? "Bonne réponse" : "Correct answer", selection: $correct) {
                        ForEach(answers.indices, id: \.self) { Text(String($0 + 1)).tag($0) }
                    }
                }
                if let error = game.community.error { Text(error) }
                Button(fr ? "Publier" : "Post") {
                    let question: [String: Any]? = includesQuestion ? ["prompt": prompt, "answers": answers, "correctIndex": correct] : nil
                    game.publishCommunityPost(category: topic, text: draft, mediaURL: photoURL, question: question)
                }.disabled(uploading || game.community.publishing || (includesQuestion && !questionReady)
                    || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .disabled(game.community.publishing)
            .scrollContentBackground(.hidden)
            .background(Theme.contentBackground.ignoresSafeArea())
            .navigationTitle(fr ? "Nouvelle publication" : "New post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark").frame(width: 44, height: 44) }
                        .accessibilityLabel(fr ? "Fermer" : "Close")
                }
            }
            .onChange(of: game.community.lastPublishedID) { if $0 != nil { dismiss() } }
            .task(id: photo) {
                guard let photo else { return }
                uploading = true; photoError = false
                defer { if self.photo == photo { uploading = false } }
                do {
                    let data = try await NativeSocialPhoto.prepare(photo)
                    let url = try await NativeSocialPhoto.upload(data, kind: .community, auth: auth)
                    if !Task.isCancelled, self.photo == photo { photoURL = url }
                } catch { if !Task.isCancelled, self.photo == photo { photoError = true } }
            }
        }
        .foregroundColor(Theme.ink).tint(Theme.accent)
    }
}

