import Foundation
import Combine

/// Provides flight data via both Combine publishers and async/await.
/// Uses an offline-first strategy: serve cached data, then update from the network.
final class FlightService {

    // MARK: - Singleton

    static let shared = FlightService()
    private init() {}

    // MARK: - Async/Await

    /// Fetches all flights from the API and caches the result.
    func fetchFlightsAsync() async throws -> [Flight] {
        let flights: [Flight] = try await APIService.shared.fetch([Flight].self, from: "/flights")
        CacheManager.shared.cache(flights, forKey: CacheKeys.flights)
        return flights
    }

    /// Fetches a single flight by ID.
    func fetchFlight(id: String) async throws -> Flight {
        try await APIService.shared.fetch(Flight.self, from: "/flights/\(id)")
    }

    /// Creates a new flight and returns the persisted record.
    func createFlight(_ flight: Flight) async throws -> Flight {
        try await APIService.shared.post(flight, to: "/flights", responseType: Flight.self)
    }

    /// Updates an existing flight.
    func updateFlight(_ flight: Flight) async throws -> Flight {
        try await APIService.shared.put(flight, to: "/flights/\(flight.id)", responseType: Flight.self)
    }

    /// Deletes a flight.
    func deleteFlight(id: String) async throws {
        try await APIService.shared.delete(path: "/flights/\(id)")
    }

    /// Background refresh – called from AppDelegate background fetch.
    func refreshFlights() async throws {
        _ = try await fetchFlightsAsync()
    }

    // MARK: - Combine

    /// Publisher that emits an array of flights, sourcing from cache first.
    func fetchFlights() -> AnyPublisher<[Flight], Error> {
        // Emit cached flights immediately if available.
        let cached: [Flight] = CacheManager.shared.retrieve(forKey: CacheKeys.flights) ?? []
        let cachePublisher = cached.isEmpty
            ? Empty<[Flight], Error>().eraseToAnyPublisher()
            : Just(cached).setFailureType(to: Error.self).eraseToAnyPublisher()

        let networkPublisher: AnyPublisher<[Flight], Error> =
            APIService.shared.publisher(for: "/flights")

        return cachePublisher
            .merge(with: networkPublisher)
            .eraseToAnyPublisher()
    }

    // MARK: - Cache keys

    private enum CacheKeys {
        static let flights = "flights"
    }
}
