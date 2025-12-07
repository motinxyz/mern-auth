/**
 * @auth/utils - Shared Type Definitions
 *
 * Consolidated types used across the utils package.
 * Single source of truth for error-related types.
 */
/**
 * Validation error detail for API responses
 */
export interface ValidationErrorDetail {
    /** Field that failed validation */
    readonly field: string;
    /** Human-readable error message (or i18n key) */
    readonly message: string;
    /** Error code for programmatic handling */
    readonly code?: string;
    /** Additional context for i18n interpolation */
    readonly context?: Readonly<Record<string, unknown>>;
}
/**
 * Zod-style issue for validation errors
 */
export interface ZodIssue {
    readonly path: string | readonly string[];
    readonly message: string;
}
/**
 * Custom validation issue format
 */
export interface CustomIssue {
    readonly field?: string;
    readonly message: string;
    readonly context?: Readonly<Record<string, unknown>>;
}
/**
 * Union type for validation issues (supports both Zod and custom formats)
 */
export type ValidationIssue = ZodIssue | CustomIssue;
/**
 * Standard API error response shape
 */
export interface ApiErrorResponse {
    readonly success: false;
    readonly statusCode: number;
    readonly message: string;
    readonly errors: readonly ValidationErrorDetail[];
    readonly data: null;
}
/**
 * Standard API success response shape
 */
export interface ApiSuccessResponse<T = unknown> {
    readonly success: true;
    readonly statusCode: number;
    readonly message: string;
    readonly data: T;
}
/**
 * Union of API response types
 */
export type ApiResponseType<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
/**
 * Error codes for programmatic error handling
 */
export declare const ERROR_CODES: {
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly CIRCUIT_OPEN: "CIRCUIT_OPEN";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly REDIS_ERROR: "REDIS_ERROR";
    readonly EMAIL_ERROR: "EMAIL_ERROR";
    readonly JOB_FAILED: "JOB_FAILED";
    readonly UNKNOWN_JOB_TYPE: "UNKNOWN_JOB_TYPE";
    readonly INVALID_JOB_DATA: "INVALID_JOB_DATA";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly ENVIRONMENT_ERROR: "ENVIRONMENT_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
//# sourceMappingURL=index.d.ts.map