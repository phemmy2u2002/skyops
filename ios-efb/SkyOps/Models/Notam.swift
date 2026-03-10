import Foundation
import CoreLocation

/// Represents a Notice to Airmen (NOTAM).
struct Notam: Identifiable, Codable {
    let id: String
    var notamNumber: String      // e.g. "A1234/24"
    var icao: String             // Affected airport / FIR
    var type: NotamType
    var startDate: Date
    var endDate: Date?           // nil = PERM
    var text: String             // Decoded NOTAM body
    var rawText: String          // Original Q-code format
    var coordinates: NotamCoordinates?
    var isRead: Bool

    // MARK: - Nested types

    enum NotamType: String, Codable, CaseIterable {
        case aerodrome  = "AERODROME"
        case enRoute    = "EN_ROUTE"
        case warning    = "WARNING"
        case airspace   = "AIRSPACE"
        case navaid     = "NAVAID"
        case obstacle   = "OBSTACLE"
        case procedure  = "PROCEDURE"
        case other      = "OTHER"

        var sfSymbol: String {
            switch self {
            case .aerodrome:  return "airplane.circle"
            case .enRoute:    return "map"
            case .warning:    return "exclamationmark.triangle.fill"
            case .airspace:   return "square.dashed"
            case .navaid:     return "antenna.radiowaves.left.and.right"
            case .obstacle:   return "antenna.radiowaves.left.and.right.slash"
            case .procedure:  return "doc.text"
            case .other:      return "info.circle"
            }
        }
    }

    struct NotamCoordinates: Codable {
        var latitude: Double
        var longitude: Double
        var radius: Double?      // Nautical miles

        var clLocation: CLLocationCoordinate2D {
            CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        }
    }

    // MARK: - Computed helpers

    var isActive: Bool {
        let now = Date()
        guard now >= startDate else { return false }
        if let end = endDate { return now <= end }
        return true   // PERM NOTAMs are always active
    }

    var isPermanent: Bool { endDate == nil }
}

// MARK: - Sample data

extension Notam {
    static let sample = Notam(
        id: "NTM-001",
        notamNumber: "A1234/24",
        icao: "KJFK",
        type: .aerodrome,
        startDate: Date().addingTimeInterval(-3600),
        endDate: Date().addingTimeInterval(3600 * 24),
        text: "RWY 04R/22L CLSD DUE TO MAINTENANCE",
        rawText: "A1234/24 NOTAMN\nQ) ZNY/QMRLC/IV/NBO/A/000/999/4037N07346W005\nA) KJFK\nB) 2401011200\nC) 2401020000\nE) RWY 04R/22L CLSD",
        coordinates: NotamCoordinates(latitude: 40.6413, longitude: -73.7781, radius: 5),
        isRead: false
    )
}
