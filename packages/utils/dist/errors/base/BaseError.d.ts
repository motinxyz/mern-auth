/**
 * BaseError - Foundation for all custom errors
 *
 * Provides consistent error structure across the application.
 * All custom errors should extend this class.
 */
import { type ErrorCode } from "../../types/index.js";
/**
 * Base error class for all application errors
 *
 * @example
 * ```typescript
 * throw new BaseError("Something went wrong", "INTERNAL_ERROR");
 * ```
 */
export declare class BaseError extends Error {
    /** Error code for programmatic handling */
    readonly code: ErrorCode;
    /** Timestamp when the error occurred */
    readonly timestamp: string;
    /** Original error that caused this error (if any) */
    readonly cause?: Error;
    constructor(message: string, code?: ErrorCode, cause?: Error);
    /**
     * Convert error to JSON-serializable object
     */
    toJSON(): Record<string, unknown>;
}
export default BaseError;
//# sourceMappingURL=BaseError.d.ts.map