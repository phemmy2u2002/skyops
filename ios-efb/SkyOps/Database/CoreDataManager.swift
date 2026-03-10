import CoreData
import Foundation

/// Thread-safe Core Data stack used for offline persistence.
final class CoreDataManager {

    // MARK: - Singleton

    static let shared = CoreDataManager()
    private init() {}

    // MARK: - Persistent container

    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "SkyOpsDataModel")

        // Enable persistent history tracking for background sync.
        let description = container.persistentStoreDescriptions.first
        description?.setOption(true as NSNumber,
                               forKey: NSPersistentHistoryTrackingKey)
        description?.setOption(true as NSNumber,
                               forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)

        container.loadPersistentStores { _, error in
            if let error = error as NSError? {
                fatalError("Unresolved Core Data error: \(error), \(error.userInfo)")
            }
        }
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return container
    }()

    // MARK: - Contexts

    /// Main-thread context – use for read operations in UI.
    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    /// Creates a private background context for write operations.
    func newBackgroundContext() -> NSManagedObjectContext {
        let ctx = persistentContainer.newBackgroundContext()
        ctx.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return ctx
    }

    // MARK: - Save helpers

    /// Saves the main view context if there are changes.
    func save() {
        let context = viewContext
        guard context.hasChanges else { return }
        do {
            try context.save()
        } catch {
            print("[CoreDataManager] Save error: \(error)")
        }
    }

    /// Saves a background context and propagates changes to the view context.
    func saveBackground(_ context: NSManagedObjectContext) {
        guard context.hasChanges else { return }
        do {
            try context.save()
        } catch {
            print("[CoreDataManager] Background save error: \(error)")
        }
    }

    // MARK: - Generic fetch

    func fetch<T: NSManagedObject>(
        _ entity: T.Type,
        predicate: NSPredicate? = nil,
        sortDescriptors: [NSSortDescriptor] = [],
        context: NSManagedObjectContext? = nil
    ) throws -> [T] {
        let ctx = context ?? viewContext
        let request = T.fetchRequest()
        request.predicate = predicate
        request.sortDescriptors = sortDescriptors
        return try ctx.fetch(request) as? [T] ?? []
    }

    // MARK: - Deletion

    func deleteAll<T: NSManagedObject>(_ entity: T.Type, context: NSManagedObjectContext? = nil) throws {
        let ctx = context ?? viewContext
        let request = NSFetchRequest<NSFetchRequestResult>(entityName: String(describing: T.self))
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        try ctx.execute(deleteRequest)
        try ctx.save()
    }
}
