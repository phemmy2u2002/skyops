import Foundation

/// Represents a single scheduled or active flight.
struct Flight: Identifiable, Codable, Hashable {
    let id: String
    var flightNumber: String
    var departure: String        // ICAO airport code
    var destination: String      // ICAO airport code
    var departureTime: Date
    var arrivalTime: Date
    var aircraft: String         // Tail number / registration
    var status: FlightStatus
    var crew: [CrewMember]

    // MARK: - Nested types

    enum FlightStatus: String, Codable, CaseIterable {
        case scheduled  = "SCHEDULED"
        case boarding   = "BOARDING"
        case departed   = "DEPARTED"
        case enRoute    = "EN_ROUTE"
        case arrived    = "ARRIVED"
        case delayed    = "DELAYED"
        case cancelled  = "CANCELLED"
        case diverted   = "DIVERTED"

        var displayName: String {
            switch self {
            case .scheduled:  return "Scheduled"
            case .boarding:   return "Boarding"
            case .departed:   return "Departed"
            case .enRoute:    return "En Route"
            case .arrived:    return "Arrived"
            case .delayed:    return "Delayed"
            case .cancelled:  return "Cancelled"
            case .diverted:   return "Diverted"
            }
        }

        var colorHex: String {
            switch self {
            case .scheduled:  return "#4A90D9"
            case .boarding:   return "#F5A623"
            case .departed:   return "#7ED321"
            case .enRoute:    return "#00BFFF"
            case .arrived:    return "#417505"
            case .delayed:    return "#E8A838"
            case .cancelled:  return "#D0021B"
            case .diverted:   return "#9B59B6"
            }
        }
    }

    struct CrewMember: Codable, Hashable {
        let id: String
        var name: String
        var role: CrewRole

        enum CrewRole: String, Codable, CaseIterable {
            case captain         = "CAPTAIN"
            case firstOfficer    = "FIRST_OFFICER"
            case flightEngineer  = "FLIGHT_ENGINEER"
            case cabinCrew       = "CABIN_CREW"
            case dispatcher      = "DISPATCHER"
        }
    }

    // MARK: - Computed helpers

    /// Flight duration in minutes.
    var durationMinutes: Int {
        Int(arrivalTime.timeIntervalSince(departureTime) / 60)
    }

    /// Formatted route string, e.g. "KJFK → KLAX".
    var route: String { "\(departure) → \(destination)" }
}

// MARK: - Sample / preview data

extension Flight {
    static let sample = Flight(
        id: "FLT-001",
        flightNumber: "SKY101",
        departure: "KJFK",
        destination: "KLAX",
        departureTime: Date().addingTimeInterval(3600),
        arrivalTime: Date().addingTimeInterval(3600 * 7),
        aircraft: "N12345",
        status: .scheduled,
        crew: [
            CrewMember(id: "CRW-1", name: "Capt. Jane Smith", role: .captain),
            CrewMember(id: "CRW-2", name: "FO John Doe",     role: .firstOfficer),
        ]
    )
}
