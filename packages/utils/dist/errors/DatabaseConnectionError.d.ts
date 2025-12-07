/**
 * DatabaseConnectionError - Database connection failure
 *
 * Thrown when the application fails to connect to the database.
 */
import { BaseError } from "./BaseError.js";
/**
 * Database connection error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new DatabaseConnectionError("Failed to connect after 3 retries", originalError);
 * ```
 */
export declare class DatabaseConnectionError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default DatabaseConnectionError;
//# sourceMappingURL=DatabaseConnectionError.d.ts.map