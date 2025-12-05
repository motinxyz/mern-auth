import timeout from "connect-timeout";
import { getLogger } from "@auth/config";

const logger = getLogger();
import { HTTP_STATUS_CODES } from "@auth/utils";

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
    (req, res, next) => {
      if (!req.timedout) {
        next();
      }
    },
  ];
};

/**
 * Timeout Error Handler
 *
 * Must be placed AFTER all routes but BEFORE the global error handler.
 * Catches timed-out requests and sends appropriate error response.
 */
export const timeoutErrorHandler = (req, res, next) => {
  if (req.timedout) {
    timeoutLogger.warn(
      {
        requestId: req.id,
        method: req.method,
        url: req.url,
        userId: req.user?.id,
      },
      "Request timed out"
    );

    // Don't send response if headers already sent
    if (!res.headersSent) {
      return res.status(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        statusCode: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
        message: "Request timeout",
        error: "The server took too long to respond. Please try again.",
      });
    }
  }
  next();
};
