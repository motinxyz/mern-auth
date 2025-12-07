import { ConfigurationError, withSpan } from "@auth/utils";
import { DB_ERRORS } from "../constants/database.messages.js";
import mongoose from "mongoose";
/**
 * Base Repository
 * Implements generic CRUD operations with observability and error handling.
 * All concrete repositories should extend this class.
 */
class BaseRepository {
    model;
    name;
    /**
     * @param {import("mongoose").Model} model - Mongoose model
     * @param {string} name - Repository name for logging/tracing
     */
    constructor(model, name) {
        if (model === undefined || model === null) {
            throw new ConfigurationError(DB_ERRORS.MISSING_MODEL.replace("{repository}", name || "BaseRepository"));
        }
        this.model = model;
        this.name = name || this.constructor.name;
    }
    /**
     * Create a new document
     * @param {object} data - Document data
     * @returns {Promise<T>}
     */
    async create(data) {
        return withSpan(`${this.name}.create`, async () => {
            // Mongoose.create can return an array or object. We assume object here.
            // If array is passed, the caller should likely use a different method or we should update types.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (await this.model.create(data));
        });
    }
    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    async findById(id) {
        return withSpan(`${this.name}.findById`, async () => {
            return this.model.findById(id);
        });
    }
    /**
     * Find one document matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<import("mongoose").Document|null>}
     */
    async findOne(filter) {
        return withSpan(`${this.name}.findOne`, async () => {
            return this.model.findOne(filter);
        });
    }
    /**
     * Find multiple documents matching filter
     * @param {object} filter - Query filter
     * @param {object} [options] - Query options (limit, skip, sort)
     * @returns {Promise<import("mongoose").Document[]>}
     */
    async find(filter, options = {}) {
        return withSpan(`${this.name}.find`, async () => {
            const query = this.model.find(filter);
            if (options.sort)
                query.sort(options.sort);
            if (options.skip !== undefined)
                query.skip(options.skip);
            if (options.limit !== undefined)
                query.limit(options.limit);
            return query.exec();
        });
    }
    /**
     * Find multiple documents matching filter with pagination
     * @param {Record<string, unknown>} query - Query filter
     * @param {object} [options] - Pagination and sort options
     * @returns {Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number; }>}
     */
    async findWithPagination(query, options = {}) {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.model
                .find(query)
                .sort(sort) // Cast to satisfy mongoose type checker if strictly required
                .skip(skip)
                .limit(limit)
                .exec(),
            this.model.countDocuments(query).exec(),
        ]);
        return {
            items,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update document by ID
     * @param {string} id - Document ID
     * @param {object} updates - Update data
     * @param {object} [options] - Mongoose update options
     * @returns {Promise<import("mongoose").Document|null>}
     */
    async update(id, updates, options = { new: true }) {
        return withSpan(`${this.name}.update`, async () => {
            return this.model.findByIdAndUpdate(id, updates, options);
        });
    }
    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<import("mongoose").Document|null>}
     */
    async delete(id) {
        return withSpan(`${this.name}.delete`, async () => {
            return this.model.findByIdAndDelete(id);
        });
    }
    /**
     * Count documents matching filter
     * @param {object} filter - Query filter
     * @returns {Promise<number>}
     */
    async count(filter = {}) {
        return withSpan(`${this.name}.count`, async () => {
            return this.model.countDocuments(filter);
        });
    }
}
export default BaseRepository;
//# sourceMappingURL=base.repository.js.map