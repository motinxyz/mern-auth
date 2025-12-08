import { ConfigurationError, withSpan } from "@auth/utils";
import { DB_ERRORS } from "../constants/database.messages.js";
import mongoose from "mongoose";
import type { FindOptions } from "@auth/contracts";

/** Sort order for queries */
type SortOrder = 1 | -1 | "asc" | "desc" | "ascending" | "descending";

/**
 * Base Repository
 *
 * Implements generic CRUD operations with observability and error handling.
 * Returns contract-compliant POJOs using .lean() and mapDocument().
 *
 * @template TDoc - Mongoose Document type
 * @template TEntity - Contract entity type (POJO)
 */
abstract class BaseRepository<TDoc extends mongoose.Document, TEntity> {
  protected readonly model: mongoose.Model<TDoc>;
  protected readonly name: string;

  /**
   * @param model - Mongoose model instance
   * @param name - Repository name for logging/tracing
   */
  constructor(model: mongoose.Model<TDoc>, name: string) {
    if (model === undefined || model === null) {
      throw new ConfigurationError(
        DB_ERRORS.MISSING_MODEL.replace("{repository}", name || "BaseRepository")
      );
    }
    this.model = model;
    this.name = name || this.constructor.name;
  }

  /**
   * Map a lean document to contract entity.
   * Must be implemented by concrete repositories.
   */
  protected abstract mapDocument(doc: unknown): TEntity | null;

  /**
   * Map multiple documents
   */
  protected mapDocuments(docs: unknown[]): TEntity[] {
    return docs
      .map(d => this.mapDocument(d))
      .filter((d): d is TEntity => d !== null);
  }

  /**
   * Create a new document
   * @param data - Document data
   */
  async create(data: Partial<TEntity>): Promise<TEntity> {
    return withSpan(`${this.name}.create`, async () => {
      const doc = new this.model(data);
      const saved = await doc.save();
      // Convert saved document to lean object and map
      const lean = saved.toObject();
      const mapped = this.mapDocument(lean);
      if (!mapped) {
        throw new Error("Failed to map created document");
      }
      return mapped;
    });
  }

  /**
   * Find document by ID
   * @param id - Document ID
   */
  async findById(id: string): Promise<TEntity | null> {
    return withSpan(`${this.name}.findById`, async () => {
      const doc = await this.model.findById(id).lean().exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Find one document matching filter
   * @param filter - Query filter
   */
  async findOne(filter: Record<string, unknown>): Promise<TEntity | null> {
    return withSpan(`${this.name}.findOne`, async () => {
      const doc = await this.model.findOne(filter).lean().exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Find multiple documents matching filter
   * @param filter - Query filter
   * @param options - Query options (limit, skip, sort)
   */
  async find(
    filter: Record<string, unknown>,
    options: FindOptions = {}
  ): Promise<TEntity[]> {
    return withSpan(`${this.name}.find`, async () => {
      let query = this.model.find(filter);

      if (options.sort !== undefined) {
        query = query.sort(options.sort as Record<string, mongoose.SortOrder>);
      }
      if (options.skip !== undefined) {
        query = query.skip(options.skip);
      }
      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }

      const docs = await query.lean().exec();
      return this.mapDocuments(docs);
    });
  }

  /**
   * Find multiple documents with pagination
   * @param query - Query filter
   * @param options - Pagination and sort options
   */
  async findWithPagination(
    query: Record<string, unknown>,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, SortOrder>;
    } = {}
  ): Promise<{
    items: TEntity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort(sort as Record<string, mongoose.SortOrder>)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return {
      items: this.mapDocuments(docs),
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
   * @param id - Document ID
   * @param updates - Update data
   */
  async update(id: string, updates: Record<string, unknown>): Promise<TEntity | null> {
    return withSpan(`${this.name}.update`, async () => {
      const doc = await this.model
        .findByIdAndUpdate(id, updates, { new: true })
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Update document by ID (IRepository contract method)
   * @param id - Document ID
   * @param data - Partial update data
   */
  async updateById(id: string, data: Partial<TEntity>): Promise<TEntity | null> {
    return withSpan(`${this.name}.updateById`, async () => {
      const doc = await this.model
        .findByIdAndUpdate(id, data as mongoose.UpdateQuery<TDoc>, { new: true })
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Delete document by ID
   * @param id - Document ID
   */
  async delete(id: string): Promise<TEntity | null> {
    return withSpan(`${this.name}.delete`, async () => {
      const doc = await this.model.findByIdAndDelete(id).lean().exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Delete document by ID (IRepository contract method)
   * @param id - Document ID
   * @returns boolean indicating if document was deleted
   */
  async deleteById(id: string): Promise<boolean> {
    return withSpan(`${this.name}.deleteById`, async () => {
      const result = await this.model.findByIdAndDelete(id).lean().exec();
      return result !== null;
    });
  }

  /**
   * Count documents matching filter
   * @param filter - Query filter
   */
  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return withSpan(`${this.name}.count`, async () => {
      return this.model.countDocuments(filter);
    });
  }
}

export default BaseRepository;
