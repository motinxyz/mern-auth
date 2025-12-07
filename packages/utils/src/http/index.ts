/**
 * HTTP Module
 *
 * Centralized HTTP-related utilities including status codes and response classes.
 */

// =============================================================================
// Status Codes
// =============================================================================

/**
 * HTTP Status Codes
 *
 * Standardized HTTP status codes used across the application.
 * Uses `as const` for type safety and inference.
 */
export const HTTP_STATUS_CODES = {
    // 2xx Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // 3xx Redirection
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,

    // 4xx Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    GONE: 410,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Type for HTTP status code values
 */
export type HttpStatusCode = (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];

/**
 * Type guard to check if a number is a valid HTTP status code
 */
export function isHttpStatusCode(code: number): code is HttpStatusCode {
    return Object.values(HTTP_STATUS_CODES).includes(code as HttpStatusCode);
}

// =============================================================================
// API Response
// =============================================================================

/**
 * Standardized API success response
 *
 * @example
 * ```typescript
 * return new ApiResponse(200, { user: { id: "123" } }, "auth:success");
 * ```
 */
export class ApiResponse<T = unknown> {
    /** Whether the request was successful */
    public readonly success: boolean;

    /** HTTP status code */
    public readonly statusCode: number;

    /** Response message (can be i18n key) */
    public readonly message: string;

    /** Response data payload */
    public readonly data: T;

    constructor(statusCode: number, data: T, message = "system:success") {
        this.success = statusCode >= 200 && statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    /**
     * Create a success response (200)
     */
    static ok<T>(data: T, message = "system:success"): ApiResponse<T> {
        return new ApiResponse(200, data, message);
    }

    /**
     * Create a created response (201)
     */
    static created<T>(data: T, message = "system:created"): ApiResponse<T> {
        return new ApiResponse(201, data, message);
    }

    /**
     * Create a no content response (204)
     */
    static noContent(message = "system:noContent"): ApiResponse<null> {
        return new ApiResponse(204, null, message);
    }

    /**
     * Convert to plain object for JSON serialization
     */
    toJSON(): { success: boolean; statusCode: number; message: string; data: T } {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
        };
    }
}
