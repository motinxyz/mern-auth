/**
 * BaseError - Foundation for all custom errors
 *
 * Provides consistent error structure across the application.
 * All custom errors should extend this class.
 */
import { ERROR_CODES } from "../types/index.js";
/**
 * Base error class for all application errors
 *
 * @example
 * ```typescript
 * throw new BaseError("Something went wrong", "INTERNAL_ERROR");
 * ```
 */
export class BaseError extends Error {
    /** Error code for programmatic handling */
    code;
    /** Timestamp when the error occurred */
    timestamp;
    /** Original error that caused this error (if any) */
    cause;
    constructor(message, code = ERROR_CODES.UNKNOWN_ERROR, cause) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date().toISOString();
        if (cause !== undefined) {
            this.cause = cause;
        }
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
        // Ensures instanceof works correctly with ES6 classes
        Object.setPrototypeOf(this, new.target.prototype);
    }
    /**
     * Convert error to JSON-serializable object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            stack: this.stack,
            cause: this.cause?.message,
        };
    }
}
export default BaseError;
//# sourceMappingURL=BaseError.js.map