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
export class ApiResponse {
    /** Whether the request was successful */
    success;
    /** HTTP status code */
    statusCode;
    /** Response message (can be i18n key) */
    message;
    /** Response data payload */
    data;
    constructor(statusCode, data, message = "system:success") {
        this.success = statusCode >= 200 && statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
    /**
     * Create a success response (200)
     */
    static ok(data, message = "system:success") {
        return new ApiResponse(200, data, message);
    }
    /**
     * Create a created response (201)
     */
    static created(data, message = "system:created") {
        return new ApiResponse(201, data, message);
    }
    /**
     * Create a no content response (204)
     */
    static noContent(message = "system:noContent") {
        return new ApiResponse(204, null, message);
    }
    /**
     * Convert to plain object for JSON serialization
     */
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
        };
    }
}
export default ApiResponse;
//# sourceMappingURL=ApiResponse.js.map