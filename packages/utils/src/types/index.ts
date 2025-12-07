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
export const ERROR_CODES = {
    // Validation
    VALIDATION_FAILED: "VALIDATION_FAILED",
    INVALID_INPUT: "INVALID_INPUT",

    // Authentication
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",

    // Resources
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    ALREADY_EXISTS: "ALREADY_EXISTS",

    // Rate Limiting
    RATE_LIMITED: "RATE_LIMITED",
    TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

    // Infrastructure
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    CIRCUIT_OPEN: "CIRCUIT_OPEN",
    DATABASE_ERROR: "DATABASE_ERROR",
    REDIS_ERROR: "REDIS_ERROR",
    EMAIL_ERROR: "EMAIL_ERROR",

    // Jobs/Queues
    JOB_FAILED: "JOB_FAILED",
    UNKNOWN_JOB_TYPE: "UNKNOWN_JOB_TYPE",
    INVALID_JOB_DATA: "INVALID_JOB_DATA",

    // Configuration
    CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
    ENVIRONMENT_ERROR: "ENVIRONMENT_ERROR",

    // Generic
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
