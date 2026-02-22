import Foundation
import CoreLocation

/// Collection of aviation-specific utility functions.
enum AviationHelpers {

    // MARK: - ICAO / IATA validation

    /// Returns `true` if `code` is a well-formed 4-letter ICAO airport identifier.
    static func isValidICAO(_ code: String) -> Bool {
        let pattern = "^[A-Z]{4}$"
        return code.range(of: pattern, options: .regularExpression) != nil
    }

    /// Returns `true` if `code` is a well-formed 3-letter IATA airport identifier.
    static func isValidIATA(_ code: String) -> Bool {
        let pattern = "^[A-Z]{3}$"
        return code.range(of: pattern, options: .regularExpression) != nil
    }

    // MARK: - Altitude / Flight Level conversion

    /// Converts a pressure altitude in feet to a Flight Level string, e.g. FL350.
    /// Altitudes below the transition altitude are returned as plain feet.
    static func toFlightLevel(_ altitudeFeet: Int,
                               transitionAltitude: Int = Constants.Aviation.transitionAltitudeFeet) -> String {
        if altitudeFeet >= transitionAltitude {
            return "FL\(altitudeFeet / 100)"
        }
        return "\(altitudeFeet) ft"
    }

    /// Parses a Flight Level string such as "FL350" and returns the altitude in feet.
    /// Returns `nil` if parsing fails.
    static func parseFlightLevel(_ string: String) -> Int? {
        let upper = string.uppercased()
        if upper.hasPrefix("FL") {
            guard let fl = Int(upper.dropFirst(2)) else { return nil }
            return fl * 100
        }
        return Int(string.filter(\.isNumber))
    }

    // MARK: - Coordinate parsing

    /// Parses a NOTAM coordinate string such as "4037N07346W" into a `CLLocationCoordinate2D`.
    ///
    /// Expected format:  DDMMhDDDMMh where h is N/S or E/W.
    static func parseNotamCoordinate(_ string: String) -> CLLocationCoordinate2D? {
        // Accept format: "DDMM[N|S]DDDMM[E|W]"
        let pattern = #"^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])$"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: string,
                                           range: NSRange(string.startIndex..., in: string)),
              match.numberOfRanges == 7 else { return nil }

        func group(_ i: Int) -> String? {
            guard let range = Range(match.range(at: i), in: string) else { return nil }
            return String(string[range])
        }

        guard let latDeg  = Double(group(1) ?? ""),
              let latMin  = Double(group(2) ?? ""),
              let latHemi = group(3),
              let lonDeg  = Double(group(4) ?? ""),
              let lonMin  = Double(group(5) ?? ""),
              let lonHemi = group(6) else { return nil }

        var lat = latDeg + latMin / 60
        var lon = lonDeg + lonMin / 60
        if latHemi == "S" { lat = -lat }
        if lonHemi == "W" { lon = -lon }
        return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }

    // MARK: - Wind

    /// Converts a magnetic heading to a cardinal direction string.
    static func cardinalDirection(from degrees: Int) -> String {
        let dirs = ["N", "NNE", "NE", "ENE",
                    "E", "ESE", "SE", "SSE",
                    "S", "SSW", "SW", "WSW",
                    "W", "WNW", "NW", "NNW"]
        let index = Int((Double(degrees) / 22.5).rounded()) % 16
        return dirs[index]
    }

    /// Converts wind speed from knots to km/h.
    static func knotsToKmh(_ knots: Double) -> Double { knots * 1.852 }

    /// Converts wind speed from knots to mph.
    static func knotsToMph(_ knots: Double) -> Double { knots * 1.15078 }

    // MARK: - Pressure

    /// Converts an altimeter setting in inHg to hPa (QNH).
    static func inHgToHPa(_ inHg: Double) -> Double { inHg * 33.8639 }

    /// Converts an altimeter setting in hPa to inHg.
    static func hPaToInHg(_ hPa: Double) -> Double { hPa / 33.8639 }

    // MARK: - Distance

    /// Calculates great-circle distance in nautical miles between two coordinates.
    static func distanceNM(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let fromLoc = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let toLoc   = CLLocation(latitude: to.latitude,   longitude: to.longitude)
        let metres  = fromLoc.distance(from: toLoc)
        return metres / 1852.0   // 1 NM = 1852 m
    }

    // MARK: - Fuel

    /// Converts fuel mass in kilograms to US gallons (Jet-A approximation at 0.804 kg/L).
    static func kgToUSGallons(_ kg: Double) -> Double { kg / (0.804 * 3.78541) }
}
