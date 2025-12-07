/**
 * HttpError - Base class for HTTP-aware errors
 *
 * Extends BaseError with HTTP status code for API responses.
 * All API-facing errors should extend this class.
 */
import { BaseError } from "./BaseError.js";
import { type ErrorCode, type ValidationErrorDetail } from "../types/index.js";
/**
 * HTTP-aware error class for API responses
 *
 * @example
 * ```typescript
 * throw new HttpError(404, "Resource not found", "NOT_FOUND");
 * ```
 */
export declare class HttpError extends BaseError {
    /** HTTP status code */
    readonly statusCode: number;
    /** Validation errors or additional error details */
    readonly errors: readonly ValidationErrorDetail[];
    /** Always false for error responses */
    readonly success: false;
    /** Always null for error responses */
    readonly data: null;
    constructor(statusCode: number, message: string, code?: ErrorCode, errors?: readonly ValidationErrorDetail[], cause?: Error);
    /**
     * Convert to API response format
     */
    toResponse(): {
        success: false;
        statusCode: number;
        message: string;
        code: ErrorCode;
        errors: readonly ValidationErrorDetail[];
        data: null;
    };
    toJSON(): Record<string, unknown>;
}
export default HttpError;
//# sourceMappingURL=HttpError.d.ts.map