import Foundation

/// Aviation weather observation (METAR) for a given station.
struct Weather: Identifiable, Codable {
    var id: String { icao }

    var icao: String
    var rawText: String          // Raw METAR string
    var observationTime: Date
    var temperature: Double      // °C
    var dewpoint: Double         // °C
    var windSpeed: Int           // knots
    var windDirection: Int?      // magnetic degrees (nil = variable)
    var windGust: Int?           // knots
    var visibility: Double       // statute miles
    var ceiling: Int?            // feet AGL (nil = no ceiling reported)
    var altimeter: Double        // inHg
    var flightCategory: FlightCategory
    var weatherPhenomena: [String]  // e.g. ["RA", "-SN"]
    var taf: String?             // Raw TAF string when available

    // MARK: - Flight categories

    enum FlightCategory: String, Codable {
        case vfr   = "VFR"
        case mvfr  = "MVFR"
        case ifr   = "IFR"
        case lifr  = "LIFR"

        var colorHex: String {
            switch self {
            case .vfr:  return "#2ECC71"
            case .mvfr: return "#3498DB"
            case .ifr:  return "#E74C3C"
            case .lifr: return "#8E44AD"
            }
        }

        var description: String {
            switch self {
            case .vfr:  return "Visual Flight Rules"
            case .mvfr: return "Marginal VFR"
            case .ifr:  return "Instrument Flight Rules"
            case .lifr: return "Low IFR"
            }
        }
    }

    // MARK: - Computed helpers

    /// Spread between temperature and dewpoint in °C.
    var tempDewSpread: Double { temperature - dewpoint }

    /// Formatted wind string, e.g. "270/15G25KT".
    var windString: String {
        let dir = windDirection.map { String(format: "%03d", $0) } ?? "VRB"
        let spd = String(format: "%02d", windSpeed)
        let gust = windGust.map { "G\(String(format: "%02d", $0))" } ?? ""
        return "\(dir)/\(spd)\(gust)KT"
    }
}

// MARK: - Sample data

extension Weather {
    static let sample = Weather(
        icao: "KJFK",
        rawText: "KJFK 011552Z 27015G25KT 10SM FEW030 BKN080 22/10 A2992",
        observationTime: Date(),
        temperature: 22,
        dewpoint: 10,
        windSpeed: 15,
        windDirection: 270,
        windGust: 25,
        visibility: 10,
        ceiling: 8000,
        altimeter: 29.92,
        flightCategory: .vfr,
        weatherPhenomena: [],
        taf: nil
    )
}
