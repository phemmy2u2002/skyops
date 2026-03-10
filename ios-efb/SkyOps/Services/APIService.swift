import Foundation
import Combine

/// Central HTTP client for all SkyOps API requests.
///
/// - Automatically attaches the JWT `Authorization: Bearer` header.
/// - Refreshes the access token on 401 responses and retries once.
/// - Decodes responses into `Decodable` types using a shared `JSONDecoder`.
final class APIService {

    // MARK: - Singleton

    static let shared = APIService()
    private init() {}

    // MARK: - Configuration

    private var baseURL: URL {
        URL(string: Constants.API.baseURL)!
    }

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest  = Constants.API.requestTimeout
        config.timeoutIntervalForResource = Constants.API.resourceTimeout
        return URLSession(configuration: config)
    }()

    static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    // MARK: - Async/Await API

    /// Fetches a `Decodable` resource from a relative path.
    func fetch<T: Decodable>(_ type: T.Type, from path: String) async throws -> T {
        let request = try buildRequest(path: path, method: "GET")
        return try await perform(request)
    }

    /// POSTs an `Encodable` body and decodes the `Decodable` response.
    func post<Body: Encodable, Response: Decodable>(
        _ body: Body,
        to path: String,
        responseType: Response.Type
    ) async throws -> Response {
        var request = try buildRequest(path: path, method: "POST")
        request.httpBody = try APIService.encoder.encode(body)
        return try await perform(request)
    }

    /// PUTs an `Encodable` body.
    func put<Body: Encodable, Response: Decodable>(
        _ body: Body,
        to path: String,
        responseType: Response.Type
    ) async throws -> Response {
        var request = try buildRequest(path: path, method: "PUT")
        request.httpBody = try APIService.encoder.encode(body)
        return try await perform(request)
    }

    /// Sends a DELETE request.
    func delete(path: String) async throws {
        let request = try buildRequest(path: path, method: "DELETE")
        _ = try await session.data(for: request)
    }

    // MARK: - Combine API

    func publisher<T: Decodable>(for path: String) -> AnyPublisher<T, Error> {
        guard let request = try? buildRequest(path: path, method: "GET") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }
        return session.dataTaskPublisher(for: request)
            .tryMap { data, response in
                try Self.validate(response: response, data: data)
                return data
            }
            .decode(type: T.self, decoder: APIService.decoder)
            .eraseToAnyPublisher()
    }

    // MARK: - Internals

    private func buildRequest(path: String, method: String) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = AuthService.shared.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        do {
            try Self.validate(response: response, data: data)
        } catch APIError.unauthorized {
            // Attempt token refresh and retry once.
            try await AuthService.shared.refreshTokens()
            var retryRequest = request
            if let token = AuthService.shared.accessToken {
                retryRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            let (retryData, retryResponse) = try await session.data(for: retryRequest)
            try Self.validate(response: retryResponse, data: retryData)
            return try APIService.decoder.decode(T.self, from: retryData)
        }
        return try APIService.decoder.decode(T.self, from: data)
    }

    private static func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        switch http.statusCode {
        case 200...299: return
        case 401: throw APIError.unauthorized
        case 403: throw APIError.forbidden
        case 404: throw APIError.notFound
        default:
            let msg = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.message
                ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
            throw APIError.serverError(statusCode: http.statusCode, message: msg)
        }
    }
}

// MARK: - Error types

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case serverError(statusCode: Int, message: String)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:      return "Invalid request URL."
        case .invalidResponse: return "Received an invalid server response."
        case .unauthorized:    return "Authentication required. Please log in again."
        case .forbidden:       return "You do not have permission to access this resource."
        case .notFound:        return "The requested resource was not found."
        case .serverError(let code, let msg): return "Server error \(code): \(msg)"
        case .decodingError(let e): return "Data parsing error: \(e.localizedDescription)"
        }
    }
}

private struct APIErrorBody: Decodable {
    let message: String
}
