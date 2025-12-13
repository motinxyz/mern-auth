/**
 * Sort direction for queries.
 * Matches MongoDB's SortOrder to ensure compatibility.
 */
export type SortDirection = 1 | -1 | "asc" | "desc" | "ascending" | "descending";

/**
 * Options for find operations.
 */
export interface FindOptions {
    /** Maximum number of documents to return */
    readonly limit?: number | undefined;
    /** Number of documents to skip (for pagination) */
    readonly skip?: number | undefined;
    /** Sort specification: numeric (1/-1) or string ('asc'/'desc') */
    readonly sort?: Readonly<Record<string, SortDirection>> | undefined;
    /** Field projection: string or object specifying fields to include/exclude */
    readonly select?: string | Readonly<Record<string, 1 | 0>> | undefined;
}
