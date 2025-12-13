/**
 * @auth/contracts - User Repository
 *
 * User-specific repository operations.
 */

import type { IRepository } from "./repository.interface.js";
import type { FindOptions } from "./query-options.interface.js";
import type { IUser } from "../entities/user.js";

/**
 * Pagination result metadata.
 */
export interface PaginationResult {
    /** Total number of items matching the query */
    readonly total: number;
    /** Current page number (1-indexed) */
    readonly page: number;
    /** Total number of pages */
    readonly pages: number;
    /** Items per page */
    readonly limit: number;
}

/**
 * User repository interface.
 * Extends base repository with user-specific queries.
 */
export interface IUserRepository extends IRepository<IUser> {
    /**
     * Find a user by email address.
     * @param email - Email address to search for
     * @returns User if found, null otherwise
     */
    findByEmail(email: string): Promise<IUser | null>;

    /**
     * Find users with pagination support.
     * @param filter - Optional query filter
     * @param options - Query options including pagination
     * @returns Paginated result with items and metadata
     */
    findWithPagination(
        filter?: Readonly<Record<string, unknown>>,
        options?: FindOptions & { readonly page?: number; readonly limit?: number }
    ): Promise<{ readonly items: readonly IUser[]; readonly pagination: PaginationResult }>;
}
