import Foundation

/// Centralised constants used throughout the SkyOps EFB.
enum Constants {

    // MARK: - API

    enum API {
        /// Base URL of the SkyOps backend API.
        /// Override via the `SKYOPS_API_URL` key in SkyOps-Info.plist for different environments.
        static var baseURL: String {
            Bundle.main.object(forInfoDictionaryKey: "SKYOPS_API_URL") as? String
                ?? "http://localhost:3000/api"
        }

        static let requestTimeout:  TimeInterval = 30
        static let resourceTimeout: TimeInterval = 60
        static let maxRetries = 2
    }

    // MARK: - Auth

    enum Auth {
        /// Number of seconds before access-token expiry to trigger a silent refresh.
        static let refreshLeadSeconds: TimeInterval = 300   // 5 minutes
    }

    // MARK: - Cache

    enum Cache {
        static let flightTTL:  TimeInterval = 300    // 5 minutes
        static let weatherTTL: TimeInterval = 1800   // 30 minutes
        static let notamTTL:   TimeInterval = 3600   // 1 hour
    }

    // MARK: - Flight statuses

    /// Human-readable display names for each `Flight.FlightStatus` value.
    enum FlightStatus {
        static let all: [String] = Flight.FlightStatus.allCases.map { $0.displayName }
    }

    // MARK: - Aircraft types

    enum Aircraft {
        static let commonTypes: [String] = [
            "B737", "B738", "B739",
            "B744", "B748",
            "B77W", "B772", "B773",
            "B788", "B789",
            "A318", "A319", "A320", "A321",
            "A332", "A333",
            "A343", "A346",
            "A359", "A35K",
            "A380",
            "CRJ2", "CRJ7", "CRJ9",
            "E170", "E175", "E190", "E195",
            "DH8D",
            "C208", "PC12",
        ]
    }

    // MARK: - Aviation limits

    enum Aviation {
        /// Standard transition altitude (US) in feet.
        static let transitionAltitudeFeet: Int = 18_000

        /// Standard sea-level pressure in inHg.
        static let standardAltimeterInHg: Double = 29.92

        /// Standard sea-level pressure in hPa.
        static let standardPressureHPa: Double = 1013.25

        /// Maximum valid wind speed to display without a gust symbol (knots).
        static let maxCalm: Int = 3
    }

    // MARK: - UI

    enum UI {
        static let cornerRadius: CGFloat     = 12
        static let listRowSpacing: CGFloat   = 8
        static let animationDuration: Double = 0.3
    }
}
