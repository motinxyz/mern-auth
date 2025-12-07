/**
 * DatabaseConnectionError - Database connection failure
 *
 * Thrown when the application fails to connect to the database.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Database connection error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new DatabaseConnectionError("Failed to connect after 3 retries", originalError);
 * ```
 */
export class DatabaseConnectionError extends BaseError {
    constructor(message = "system:errors.databaseConnection", cause) {
        super(message, ERROR_CODES.DATABASE_ERROR, cause);
    }
}
export default DatabaseConnectionError;
//# sourceMappingURL=DatabaseConnectionError.js.map