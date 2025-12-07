/**
 * HTTP Module
 *
 * Centralized HTTP-related utilities including status codes and response classes.
 */
/**
 * HTTP Status Codes
 *
 * Standardized HTTP status codes used across the application.
 * Uses `as const` for type safety and inference.
 */
export declare const HTTP_STATUS_CODES: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly MOVED_PERMANENTLY: 301;
    readonly FOUND: 302;
    readonly NOT_MODIFIED: 304;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly GONE: 410;
    readonly UNPROCESSABLE_CONTENT: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly NOT_IMPLEMENTED: 501;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * Type for HTTP status code values
 */
export type HttpStatusCode = (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];
/**
 * Type guard to check if a number is a valid HTTP status code
 */
export declare function isHttpStatusCode(code: number): code is HttpStatusCode;
/**
 * Standardized API success response
 *
 * @example
 * ```typescript
 * return new ApiResponse(200, { user: { id: "123" } }, "auth:success");
 * ```
 */
export declare class ApiResponse<T = unknown> {
    /** Whether the request was successful */
    readonly success: boolean;
    /** HTTP status code */
    readonly statusCode: number;
    /** Response message (can be i18n key) */
    readonly message: string;
    /** Response data payload */
    readonly data: T;
    constructor(statusCode: number, data: T, message?: string);
    /**
     * Create a success response (200)
     */
    static ok<T>(data: T, message?: string): ApiResponse<T>;
    /**
     * Create a created response (201)
     */
    static created<T>(data: T, message?: string): ApiResponse<T>;
    /**
     * Create a no content response (204)
     */
    static noContent(message?: string): ApiResponse<null>;
    /**
     * Convert to plain object for JSON serialization
     */
    toJSON(): {
        success: boolean;
        statusCode: number;
        message: string;
        data: T;
    };
}
//# sourceMappingURL=index.d.ts.map