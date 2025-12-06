/**
 * Base Repository
 * Implements generic CRUD operations with observability and error handling.
 * All concrete repositories should extend this class.
 */
declare class BaseRepository {
    protected model: any;
    protected name: string;
    /**
     * @param {import("mongoose").Model} model - Mongoose model
     * @param {string} name - Repository name for logging/tracing
     */
    constructor(model: any, name: string);
    /**
     * Create a new document
     * @param {object} data - Document data
     * @returns {Promise<import("mongoose").Document>}
     */
    create(data: any): Promise<any>;
    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    findById(id: any): Promise<any>;
    /**
     * Find one document matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<import("mongoose").Document|null>}
     */
    findOne(filter: any): Promise<any>;
    /**
     * Find multiple documents matching filter
     * @param {object} filter - Query filter
     * @param {object} [options] - Query options (limit, skip, sort)
     * @returns {Promise<import("mongoose").Document[]>}
     */
    find(filter: any, options?: any): Promise<any>;
    /**
     * Update document by ID
     * @param {string} id - Document ID
     * @param {object} updates - Update data
     * @param {object} [options] - Mongoose update options
     * @returns {Promise<import("mongoose").Document|null>}
     */
    update(id: any, updates: any, options?: {
        new: boolean;
    }): Promise<any>;
    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    delete(id: any): Promise<any>;
    /**
     * Count documents matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<number>}
     */
    count(filter?: {}): Promise<any>;
}
export default BaseRepository;
//# sourceMappingURL=base.repository.d.ts.map