import { ConfigurationError, withSpan } from "@auth/utils";
import { DB_ERRORS } from "../constants/database.messages.js";
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
        if (!model) {
            throw new ConfigurationError(DB_ERRORS.MISSING_MODEL.replace("{repository}", name || "BaseRepository"));
        }
        this.model = model;
        this.name = name || this.constructor.name;
    }
    /**
     * Create a new document
     * @param {object} data - Document data
     * @returns {Promise<import("mongoose").Document>}
     */
    async create(data) {
        return withSpan(`${this.name}.create`, async () => {
            return this.model.create(data);
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
            if (options.skip)
                query.skip(options.skip);
            if (options.limit)
                query.limit(options.limit);
            return query.exec();
        });
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