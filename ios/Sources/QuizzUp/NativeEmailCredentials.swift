import Foundation

struct NativeEmailCredentials {
    let email: String
    let password: String
    let confirmation: String

    var address: String { email.trimmingCharacters(in: .whitespacesAndNewlines) }
    var validAddress: Bool {
        address.count <= 254 && address.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#, options: .regularExpression) != nil
    }
    var canSignIn: Bool { validAddress && !password.isEmpty }
    var canCreateAccount: Bool { validAddress && password.count >= 6 && confirmation == password }
}
