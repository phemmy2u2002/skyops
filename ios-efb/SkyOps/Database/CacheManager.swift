import Foundation

/// In-memory + disk cache for offline-first data delivery.
///
/// Entries are keyed by a `String` and serialised to `Codable` using JSON.
/// Each entry carries an expiry timestamp so stale data is automatically evicted.
final class CacheManager {

    // MARK: - Singleton

    static let shared = CacheManager()
    private init() { createCacheDirectory() }

    // MARK: - Configuration

    private let defaultTTL: TimeInterval = 1800   // 30 minutes
    private let cacheDirectory: URL = {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("SkyOpsCache", isDirectory: true)
    }()

    // MARK: - In-memory store

    private var memoryCache: [String: CacheEntry] = [:]
    private let lock = NSLock()

    // MARK: - Public API

    /// Stores an encodable value with an optional custom TTL.
    func cache<T: Encodable>(_ value: T, forKey key: String, ttl: TimeInterval? = nil) {
        guard let data = try? JSONEncoder().encode(value) else { return }
        let entry = CacheEntry(data: data, expiresAt: Date().addingTimeInterval(ttl ?? defaultTTL))
        lock.withLock { memoryCache[key] = entry }
        persistToDisk(entry: entry, key: key)
    }

    /// Retrieves a cached decodable value. Returns `nil` if missing or expired.
    func retrieve<T: Decodable>(forKey key: String) -> T? {
        // 1. Check memory cache.
        if let entry = lock.withLock({ memoryCache[key] }), !entry.isExpired {
            return try? JSONDecoder().decode(T.self, from: entry.data)
        }
        // 2. Fall back to disk.
        if let entry = loadFromDisk(key: key), !entry.isExpired {
            lock.withLock { memoryCache[key] = entry }
            return try? JSONDecoder().decode(T.self, from: entry.data)
        }
        return nil
    }

    /// Removes a single cache entry.
    func remove(forKey key: String) {
        lock.withLock { memoryCache.removeValue(forKey: key) }
        let url = diskURL(for: key)
        try? FileManager.default.removeItem(at: url)
    }

    /// Clears all cached data (memory + disk).
    func clearAll() {
        lock.withLock { memoryCache.removeAll() }
        try? FileManager.default.removeItem(at: cacheDirectory)
        createCacheDirectory()
    }

    /// Evicts all expired entries from memory and disk.
    func evictExpired() {
        let expired = lock.withLock {
            memoryCache.filter { $0.value.isExpired }.map { $0.key }
        }
        for key in expired {
            remove(forKey: key)
        }
    }

    // MARK: - Disk persistence

    private func persistToDisk(entry: CacheEntry, key: String) {
        guard let data = try? JSONEncoder().encode(entry) else { return }
        try? data.write(to: diskURL(for: key), options: .atomic)
    }

    private func loadFromDisk(key: String) -> CacheEntry? {
        guard let data = try? Data(contentsOf: diskURL(for: key)) else { return nil }
        return try? JSONDecoder().decode(CacheEntry.self, from: data)
    }

    private func diskURL(for key: String) -> URL {
        // Sanitise key to a safe file name.
        let safeName = key.replacingOccurrences(of: "/", with: "_")
        return cacheDirectory.appendingPathComponent("\(safeName).cache")
    }

    private func createCacheDirectory() {
        try? FileManager.default.createDirectory(at: cacheDirectory,
                                                  withIntermediateDirectories: true)
    }
}

// MARK: - Cache entry

private struct CacheEntry: Codable {
    let data: Data
    let expiresAt: Date

    var isExpired: Bool { Date() > expiresAt }
}

// MARK: - NSLock convenience

private extension NSLock {
    @discardableResult
    func withLock<T>(_ body: () -> T) -> T {
        lock(); defer { unlock() }
        return body()
    }
}
