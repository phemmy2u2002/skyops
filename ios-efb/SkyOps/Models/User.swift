import Foundation

/// Authenticated user account.
struct User: Identifiable, Codable {
    let id: String
    var username: String
    var email: String
    var role: UserRole
    var token: String?           // JWT access token (transient – stored in Keychain)
    var refreshToken: String?    // Refresh token (transient – stored in Keychain)
    var firstName: String?
    var lastName: String?
    var profileImageURL: URL?

    // MARK: - Nested types

    enum UserRole: String, Codable, CaseIterable {
        case admin       = "ADMIN"
        case dispatcher  = "DISPATCHER"
        case pilot       = "PILOT"
        case viewer      = "VIEWER"

        var displayName: String {
            switch self {
            case .admin:      return "Administrator"
            case .dispatcher: return "Dispatcher"
            case .pilot:      return "Pilot"
            case .viewer:     return "Viewer"
            }
        }

        /// Returns true if the role is allowed to modify flight data.
        var canEditFlights: Bool {
            switch self {
            case .admin, .dispatcher: return true
            case .pilot, .viewer:     return false
            }
        }
    }

    // MARK: - Computed helpers

    var displayName: String {
        if let first = firstName, let last = lastName {
            return "\(first) \(last)"
        }
        return username
    }
}

// MARK: - Coding keys (omit tokens from API serialisation)

extension User {
    enum CodingKeys: String, CodingKey {
        case id, username, email, role
        case firstName, lastName, profileImageURL
        // token and refreshToken are never sent to/from the API body
    }
}

// MARK: - Sample data

extension User {
    static let sample = User(
        id: "USR-001",
        username: "jsmith",
        email: "jsmith@skyops.aero",
        role: .dispatcher,
        token: nil,
        refreshToken: nil,
        firstName: "Jane",
        lastName: "Smith",
        profileImageURL: nil
    )
}
