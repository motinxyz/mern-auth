/**
 * HttpError - Base class for HTTP-aware errors
 *
 * Extends BaseError with HTTP status code for API responses.
 * All API-facing errors should extend this class.
 */

import { BaseError } from "./BaseError.js";
import { ERROR_CODES, type ErrorCode, type ValidationErrorDetail } from "../../types/index.js";

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
    public readonly statusCode: number;

    /** Validation errors or additional error details */
    public readonly errors: readonly ValidationErrorDetail[];

    /** Always false for error responses */
    public readonly success: false = false;

    /** Always null for error responses */
    public readonly data: null = null;

    constructor(
        statusCode: number,
        message: string,
        code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
        errors: readonly ValidationErrorDetail[] = [],
        cause?: Error
    ) {
        super(message, code, cause);
        this.statusCode = statusCode;
        this.errors = errors;
    }

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
    } {
        return {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            code: this.code,
            errors: this.errors,
            data: null,
        };
    }

    override toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            statusCode: this.statusCode,
            errors: this.errors,
            success: this.success,
        };
    }
}

export default HttpError;
