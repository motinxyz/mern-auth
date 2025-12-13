import timeout from "connect-timeout";
import { getLogger } from "@auth/app-bootstrap";
import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS_CODES } from "@auth/utils";

const logger = getLogger();
const timeoutLogger = logger.child({ module: "request-timeout" });

/**
 * Request Timeout Middleware
 *
 * Automatically aborts requests that take longer than the specified duration.
 * Prevents resource exhaustion from slow/hanging requests.
 *
 * @param {number} duration - Timeout duration in milliseconds (default: 30000ms = 30s)
 * @returns {Array} Array of middleware functions
 */
export const createTimeoutMiddleware = (duration = 30000) => {
  return [
    // Apply timeout
    timeout(duration),

    // Check if request timed out before proceeding
    (req: Request, _res: Response, next: NextFunction) => {
      // timedout property added via global augmentation
      if (req.timedout === true) {
        // Halt execution, timeout middleware will handle response
        return;
      }
      next();
    },
  ];
};

/**
 * Timeout Error Handler
 *
 * Must be placed AFTER all routes but BEFORE the global error handler.
 * Catches timed-out requests and sends appropriate error response.
 */
export const timeoutErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.timedout === true) {
    timeoutLogger.warn(
      {
        requestId: req.id, // req.id might be added by pino-http or standard express
        method: req.method,
        url: req.url,
        userId: req.user?.id ?? req.user?._id,
      },
      "Request timed out"
    );

    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        statusCode: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
        message: "Request timeout",
        error: "The server took too long to respond. Please try again.",
      });
      return;
    }
  }
  next();
};
