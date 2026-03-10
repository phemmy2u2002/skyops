import Foundation
import Security

/// Manages user authentication, JWT tokens, and session lifecycle.
/// Tokens are persisted securely in the iOS Keychain.
@MainActor
final class AuthService: ObservableObject {

    // MARK: - Singleton

    static let shared = AuthService()
    private init() {}

    // MARK: - Published state

    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    @Published var isLoggingIn: Bool = false
    @Published var loginError: String?

    // MARK: - Token accessors

    var accessToken: String? {
        KeychainHelper.read(key: KeychainKeys.accessToken)
    }

    private var refreshToken: String? {
        KeychainHelper.read(key: KeychainKeys.refreshToken)
    }

    // MARK: - Auth operations

    /// Attempts to log in with the supplied credentials.
    func login(username: String, password: String) async {
        isLoggingIn = true
        loginError = nil
        defer { isLoggingIn = false }

        struct LoginRequest: Encodable {
            let username: String
            let password: String
        }

        struct LoginResponse: Decodable {
            let token: String
            let refreshToken: String
            let user: User
        }

        do {
            let response: LoginResponse = try await APIService.shared.post(
                LoginRequest(username: username, password: password),
                to: "/auth/login",
                responseType: LoginResponse.self
            )
            storeTokens(access: response.token, refresh: response.refreshToken)
            currentUser = response.user
            isAuthenticated = true
        } catch {
            loginError = error.localizedDescription
        }
    }

    /// Registers a new account.
    func register(username: String, email: String, password: String, role: User.UserRole) async throws {
        struct RegisterRequest: Encodable {
            let username, email, password: String
            let role: String
        }

        struct RegisterResponse: Decodable {
            let token: String
            let refreshToken: String
            let user: User
        }

        let response: RegisterResponse = try await APIService.shared.post(
            RegisterRequest(username: username, email: email, password: password, role: role.rawValue),
            to: "/auth/register",
            responseType: RegisterResponse.self
        )
        storeTokens(access: response.token, refresh: response.refreshToken)
        currentUser = response.user
        isAuthenticated = true
    }

    /// Silently refreshes the JWT access token using the stored refresh token.
    func refreshTokens() async throws {
        guard let refresh = refreshToken else { throw APIError.unauthorized }

        struct RefreshRequest: Encodable  { let refreshToken: String }
        struct RefreshResponse: Decodable { let token: String; let refreshToken: String }

        let response: RefreshResponse = try await APIService.shared.post(
            RefreshRequest(refreshToken: refresh),
            to: "/auth/refresh",
            responseType: RefreshResponse.self
        )
        storeTokens(access: response.token, refresh: response.refreshToken)
    }

    /// Signs out the current user and clears stored credentials.
    func logout() {
        KeychainHelper.delete(key: KeychainKeys.accessToken)
        KeychainHelper.delete(key: KeychainKeys.refreshToken)
        currentUser = nil
        isAuthenticated = false
    }

    /// Called at app launch to restore a previous session.
    func restoreSession() {
        guard accessToken != nil else { return }
        isAuthenticated = true
        Task { try? await refreshTokens() }
    }

    // MARK: - Helpers

    private func storeTokens(access: String, refresh: String) {
        KeychainHelper.write(key: KeychainKeys.accessToken, value: access)
        KeychainHelper.write(key: KeychainKeys.refreshToken, value: refresh)
    }

    private enum KeychainKeys {
        static let accessToken  = "com.skyops.efb.accessToken"
        static let refreshToken = "com.skyops.efb.refreshToken"
    }
}

// MARK: - Keychain helper

enum KeychainHelper {
    static func write(key: String, value: String) {
        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecValueData:   data,
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    static func read(key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecAttrAccount:      key,
            kSecReturnData:       true,
            kSecMatchLimit:       kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let value = String(data: data, encoding: .utf8) else { return nil }
        return value
    }

    static func delete(key: String) {
        let query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
