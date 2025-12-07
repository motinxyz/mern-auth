/**
 * @auth/utils - Shared Type Definitions
 *
 * Consolidated types used across the utils package.
 * Single source of truth for error-related types.
 */
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
};
//# sourceMappingURL=index.js.map