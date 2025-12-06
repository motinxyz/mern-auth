/**
 * IRepository - Generic repository interface
 */
export interface IRepository<T> {
    /**
     * Find a document by ID
     */
    findById(id: string): Promise<T | null>;

    /**
     * Find one document matching filter
     */
    findOne(filter: Record<string, unknown>): Promise<T | null>;

    /**
     * Find multiple documents
     */
    find(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]>;

    /**
     * Create a new document
     */
    create(data: Partial<T>): Promise<T>;

    /**
     * Update a document by ID
     */
    updateById(id: string, data: Partial<T>): Promise<T | null>;

    /**
     * Delete a document by ID
     */
    deleteById(id: string): Promise<boolean>;

    /**
     * Count documents matching filter
     */
    count(filter?: Record<string, unknown>): Promise<number>;
}

export interface FindOptions {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    select?: string | Record<string, 1 | 0>;
}
