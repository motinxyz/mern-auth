import type { Request, Response, NextFunction } from "express";
interface TimeoutRequest extends Request {
    timedout?: boolean;
    user?: {
        id: string;
    };
}
/**
 * Request Timeout Middleware
 *
 * Automatically aborts requests that take longer than the specified duration.
 * Prevents resource exhaustion from slow/hanging requests.
 *
 * @param {number} duration - Timeout duration in milliseconds (default: 30000ms = 30s)
 * @returns {Array} Array of middleware functions
 */
export declare const createTimeoutMiddleware: (duration?: number) => any[];
/**
 * Timeout Error Handler
 *
 * Must be placed AFTER all routes but BEFORE the global error handler.
 * Catches timed-out requests and sends appropriate error response.
 */
export declare const timeoutErrorHandler: (req: TimeoutRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=timeout.d.ts.map