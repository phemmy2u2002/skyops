import Foundation
import Combine

/// Fetches METAR and TAF weather data.
final class WeatherService {

    // MARK: - Singleton

    static let shared = WeatherService()
    private init() {}

    // MARK: - Async/Await

    /// Fetches the latest METAR for the given ICAO code (e.g. "KJFK").
    func fetchWeatherAsync(for icao: String) async throws -> Weather {
        let icaoUpper = icao.uppercased()
        let wx: Weather = try await APIService.shared.fetch(Weather.self, from: "/weather/\(icaoUpper)")
        CacheManager.shared.cache(wx, forKey: cacheKey(icaoUpper))
        return wx
    }

    /// Fetches only the TAF for the given ICAO.
    func fetchTAF(for icao: String) async throws -> String {
        struct TAFResponse: Decodable { let rawText: String }
        let resp: TAFResponse = try await APIService.shared.fetch(
            TAFResponse.self, from: "/weather/\(icao.uppercased())/taf"
        )
        return resp.rawText
    }

    /// Fetches weather for multiple ICAO codes concurrently.
    func fetchWeather(for icaos: [String]) async throws -> [String: Weather] {
        try await withThrowingTaskGroup(of: Weather.self) { group in
            for icao in icaos {
                group.addTask { try await self.fetchWeatherAsync(for: icao) }
            }
            var result: [String: Weather] = [:]
            for try await wx in group {
                result[wx.icao] = wx
            }
            return result
        }
    }

    // MARK: - Combine

    func weatherPublisher(for icao: String) -> AnyPublisher<Weather, Error> {
        APIService.shared.publisher(for: "/weather/\(icao.uppercased())")
    }

    // MARK: - Cache helpers

    private func cacheKey(_ icao: String) -> String { "weather_\(icao)" }

    /// Returns cached weather if available and not stale (within `maxAgeSeconds`).
    func cachedWeather(for icao: String, maxAgeSeconds: TimeInterval = 1800) -> Weather? {
        CacheManager.shared.retrieve(forKey: cacheKey(icao.uppercased()))
    }
}
