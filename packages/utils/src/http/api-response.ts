/**
 * ApiResponse Class
 *
 * Standardized API success response.
 * Implements IApiResponse from @auth/contracts.
 */

import type { IApiResponse } from "@auth/contracts";

/**
 * Standardized API success response class
 *
 * @example
 * ```typescript
 * return new ApiResponse(200, { user: { id: "123" } }, "auth:success");
 * ```
 */
export class ApiResponse<T = unknown> implements IApiResponse<T> {
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
    toJSON(): IApiResponse<T> {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
        };
    }
}
