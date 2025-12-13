/**
 * HTTP Status Codes
 *
 * Standard HTTP status codes with TypeScript type safety.
 * Shared between frontend and backend.
 */

/**
 * Standard HTTP Status Codes
 * Uses `as const` for literal type inference.
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
export type HttpStatusCode =
    (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];

/**
 * Type guard to check if a number is a valid HTTP status code
 */
export function isHttpStatusCode(code: number): code is HttpStatusCode {
    return Object.values(HTTP_STATUS_CODES).includes(code as HttpStatusCode);
}
