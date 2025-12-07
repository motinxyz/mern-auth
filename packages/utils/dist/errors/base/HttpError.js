/**
 * HttpError - Base class for HTTP-aware errors
 *
 * Extends BaseError with HTTP status code for API responses.
 * All API-facing errors should extend this class.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../../types/index.js";
/**
 * HTTP-aware error class for API responses
 *
 * @example
 * ```typescript
 * throw new HttpError(404, "Resource not found", "NOT_FOUND");
 * ```
 */
export class HttpError extends BaseError {
    /** HTTP status code */
    statusCode;
    /** Validation errors or additional error details */
    errors;
    /** Always false for error responses */
    success = false;
    /** Always null for error responses */
    data = null;
    constructor(statusCode, message, code = ERROR_CODES.INTERNAL_ERROR, errors = [], cause) {
        super(message, code, cause);
        this.statusCode = statusCode;
        this.errors = errors;
    }
    /**
     * Convert to API response format
     */
    toResponse() {
        return {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            code: this.code,
            errors: this.errors,
            data: null,
        };
    }
    toJSON() {
        return {
            ...super.toJSON(),
            statusCode: this.statusCode,
            errors: this.errors,
            success: this.success,
        };
    }
}
export default HttpError;
//# sourceMappingURL=HttpError.js.map