/**
 * ApiResponse - Standardized API success response
 *
 * Provides consistent response structure for API endpoints.
 */
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
export default ApiResponse;
//# sourceMappingURL=ApiResponse.d.ts.map