import Foundation

enum NativeEmailSignInLink {
    static let host = "quizzup-ae633.firebaseapp.com"

    static func actionURL(from incoming: URL) -> URL? {
        guard let incoming = URLComponents(url: incoming, resolvingAgainstBaseURL: false),
              isProjectURL(incoming) else { return nil }

        let action: URLComponents
        switch incoming.path {
        case "/__/auth/links":
            guard let wrapped = incoming.queryItems?.first(where: { $0.name == "link" })?.value,
                  let decoded = URLComponents(string: wrapped), isProjectURL(decoded) else { return nil }
            action = decoded
        case "/__/auth/action":
            action = incoming
        default:
            return nil
        }

        guard action.path == "/__/auth/action",
              action.queryItems?.contains(where: { $0.name == "mode" && $0.value == "signIn" }) == true,
              action.queryItems?.contains(where: { $0.name == "oobCode" && $0.value?.isEmpty == false }) == true else {
            return nil
        }
        return action.url
    }

    private static func isProjectURL(_ components: URLComponents) -> Bool {
        components.scheme == "https" && components.host == host &&
            components.port == nil && components.user == nil && components.password == nil
    }
}
