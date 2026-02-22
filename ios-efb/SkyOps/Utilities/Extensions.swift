import SwiftUI

// MARK: - Date extensions

extension Date {
    /// Zulu / UTC time string suitable for aviation displays, e.g. "1530Z".
    var zuluString: String {
        let f = DateFormatter()
        f.dateFormat = "HHmm"
        f.timeZone = TimeZone(identifier: "UTC")
        return f.string(from: self) + "Z"
    }

    /// Full METAR-style date-time group, e.g. "011530Z".
    var metarDTG: String {
        let f = DateFormatter()
        f.dateFormat = "ddHHmm"
        f.timeZone = TimeZone(identifier: "UTC")
        return f.string(from: self) + "Z"
    }

    /// Returns a human-readable relative string (e.g. "2 hours ago").
    var relativeString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: Date())
    }

    /// True if the date is within the next `hours` hours.
    func isWithinNextHours(_ hours: Int) -> Bool {
        let future = Date().addingTimeInterval(TimeInterval(hours * 3600))
        return self >= Date() && self <= future
    }
}

// MARK: - Color extensions

extension Color {
    /// SkyOps brand blue.
    static let skyBlue = Color(hex: "#4A90D9")

    /// Initialises a `Color` from a CSS hex string (e.g. "#FF5733" or "FF5733").
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red:     Double(r) / 255,
            green:   Double(g) / 255,
            blue:    Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - String extensions (aviation)

extension String {
    /// Returns true if the string looks like a valid ICAO airport code.
    var isValidICAO: Bool { AviationHelpers.isValidICAO(self) }

    /// Returns true if the string looks like a valid IATA airport code.
    var isValidIATA: Bool {
        let pattern = "^[A-Z]{3}$"
        return range(of: pattern, options: .regularExpression) != nil
    }

    /// Pads the string on the left with `character` to reach `length`.
    func leftPadded(to length: Int, with character: Character = "0") -> String {
        let padding = max(0, length - count)
        return String(repeating: character, count: padding) + self
    }
}

// MARK: - Double / Int formatting

extension Double {
    /// Formats a pressure value as inHg with two decimal places.
    var inHgString: String { String(format: "%.2f inHg", self) }

    /// Converts Celsius to Fahrenheit.
    var toFahrenheit: Double { self * 9 / 5 + 32 }
}

extension Int {
    /// Formats an altitude/flight level, e.g. 35000 → "FL350".
    var flightLevel: String {
        self >= 18000 ? "FL\(self / 100)" : "\(self) ft"
    }
}

// MARK: - View extensions

extension View {
    /// Applies a card-style background with rounded corners and a subtle shadow.
    func cardStyle(cornerRadius: CGFloat = 12) -> some View {
        self
            .background(Color(.secondarySystemBackground))
            .cornerRadius(cornerRadius)
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
    }
}
