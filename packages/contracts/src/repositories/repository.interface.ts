/**
 * @auth/contracts - Repository Interface
 *
 * Generic repository pattern interface for data access abstraction.
 * All entity-specific repositories should extend this base interface.
 */

import type { FindOptions } from "./query-options.interface.js";

// =============================================================================
// Generic Repository Interface
// =============================================================================

// =============================================================================
// Generic Repository Interface
// =============================================================================

/**
 * Generic repository interface for CRUD operations.
 *
 * Provides a consistent abstraction over data storage implementations.
 * Entity-specific repositories should extend this with custom queries.
 *
 * @template T - The entity type this repository manages
 *
 * @example
 * ```typescript
 * interface IUserRepository extends IRepository<IUser> {
 *   findByEmail(email: string): Promise<IUser | null>;
 * }
 * ```
 */
export interface IRepository<T> {
    /**
     * Find a document by its unique identifier.
     * @param id - Document ID
     * @returns Document if found, null otherwise
     */
    findById(id: string): Promise<T | null>;

    /**
     * Find a single document matching the filter.
     * @param filter - Query filter
     * @returns First matching document or null
     */
    findOne(filter: Readonly<Record<string, unknown>>): Promise<T | null>;

    /**
     * Find multiple documents matching the filter.
     * @param filter - Query filter
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of matching documents
     */
    find(filter: Readonly<Record<string, unknown>>, options?: FindOptions): Promise<readonly T[]>;

    /**
     * Create a new document.
     * @param data - Document data (partial, IDs will be generated)
     * @returns Created document with generated fields
     */
    create(data: Readonly<Partial<T>>): Promise<T>;

    /**
     * Update a document by ID.
     * @param id - Document ID
     * @param data - Fields to update
     * @returns Updated document or null if not found
     */
    updateById(id: string, data: Readonly<Partial<T>>): Promise<T | null>;

    /**
     * Delete a document by ID.
     * @param id - Document ID
     * @returns true if deleted, false if not found
     */
    deleteById(id: string): Promise<boolean>;

    /**
     * Count documents matching the filter.
     * @param filter - Optional query filter
     * @returns Number of matching documents
     */
    count(filter?: Readonly<Record<string, unknown>>): Promise<number>;
}
