import mongoose from "mongoose";
type SortOrder = 1 | -1 | "asc" | "desc" | "ascending" | "descending";
/**
 * Base Repository
 * Implements generic CRUD operations with observability and error handling.
 * All concrete repositories should extend this class.
 */
declare class BaseRepository<T extends mongoose.Document> {
    protected model: mongoose.Model<T>;
    protected name: string;
    /**
     * @param {import("mongoose").Model} model - Mongoose model
     * @param {string} name - Repository name for logging/tracing
     */
    constructor(model: mongoose.Model<T>, name: string);
    /**
     * Create a new document
     * @param {object} data - Document data
     * @returns {Promise<T>}
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    findById(id: string): Promise<mongoose.IfAny<T, any, mongoose.Document<unknown, {}, T, {}, mongoose.DefaultSchemaOptions> & mongoose.Require_id<T> & {
        __v: number;
    }> | null>;
    /**
     * Find one document matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<import("mongoose").Document|null>}
     */
    findOne(filter: Record<string, unknown>): Promise<mongoose.IfAny<T, any, mongoose.Document<unknown, {}, T, {}, mongoose.DefaultSchemaOptions> & mongoose.Require_id<T> & {
        __v: number;
    }> | null>;
    /**
     * Find multiple documents matching filter
     * @param {object} filter - Query filter
     * @param {object} [options] - Query options (limit, skip, sort)
     * @returns {Promise<import("mongoose").Document[]>}
     */
    find(filter: Record<string, unknown>, options?: {
        sort?: Record<string, SortOrder>;
        skip?: number;
        limit?: number;
    }): Promise<mongoose.IfAny<T, any, mongoose.Document<unknown, {}, T, {}, mongoose.DefaultSchemaOptions> & mongoose.Require_id<T> & {
        __v: number;
    }>[]>;
    /**
     * Find multiple documents matching filter with pagination
     * @param {Record<string, unknown>} query - Query filter
     * @param {object} [options] - Pagination and sort options
     * @returns {Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number; }>}
     */
    findWithPagination(query: Record<string, unknown>, options?: {
        page?: number;
        limit?: number;
        sort?: Record<string, SortOrder>;
    }): Promise<{
        items: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    /**
     * Update document by ID
     * @param {string} id - Document ID
     * @param {object} updates - Update data
     * @param {object} [options] - Mongoose update options
     * @returns {Promise<import("mongoose").Document|null>}
     */
    update(id: string, updates: Record<string, unknown>, options?: {
        new: boolean;
    }): Promise<mongoose.IfAny<T, any, mongoose.Document<unknown, {}, T, {}, mongoose.DefaultSchemaOptions> & mongoose.Require_id<T> & {
        __v: number;
    }> | null>;
    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    delete(id: string): Promise<mongoose.IfAny<T, any, mongoose.Document<unknown, {}, T, {}, mongoose.DefaultSchemaOptions> & mongoose.Require_id<T> & {
        __v: number;
    }> | null>;
    /**
     * Count documents matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<number>}
     */
    count(filter?: Record<string, unknown>): Promise<number>;
}
export default BaseRepository;
//# sourceMappingURL=base.repository.d.ts.map