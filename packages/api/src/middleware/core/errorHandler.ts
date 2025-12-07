import { getLogger } from "@auth/config";

const logger = getLogger();
import {
  HTTP_STATUS_CODES,
  HttpError,
  ValidationError,
  ConflictError,
  BaseError,
} from "@auth/utils";

const errorHandlerLogger = logger.child({ module: "errorHandler" });
interface MongooseValidationError extends Error {
  errors: Record<string, {
    path: string;
    message: string;
    properties?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }>;
}

interface MongoServerError extends Error {
  code: number;
  keyPattern: Record<string, unknown>;
  keyValue: Record<string, unknown>;
}

function convertExternalError(err: Error): HttpError | null {
  // Handle Mongoose Validation Errors
  // If the error is a ValidationError from our `validate` middleware, it's already structured correctly.
  if (err instanceof ValidationError) {
    return err;
  }

  if (err.name === "ValidationError" && (err as MongooseValidationError).errors !== undefined) {
    const mongoErr = err as MongooseValidationError;
    const errors = Object.values(mongoErr.errors).map((e) => {
      const context = e.properties ?? e.context ?? {};
      // Map Mongoose properties to translation keys
      const contextRecord = context as Record<string, unknown>;
      if (contextRecord.minlength !== undefined) contextRecord.count = contextRecord.minlength;
      if (contextRecord.maxlength !== undefined) contextRecord.count = contextRecord.maxlength;

      return {
        field: e.path,
        message: e.message,
        context: contextRecord,
      };
    });
    return new ValidationError(errors, "validation:failed");
  }

  // Handle Mongoose Duplicate Key Errors (e.g., unique index violation)
  if (err.name === "MongoServerError" && (err as MongoServerError).code === 11000) {
    const mongoErr = err as MongoServerError;
    const field = Object.keys(mongoErr.keyPattern)[0] ?? "unknown";
    const errors = [{ field, message: "validation:duplicateValue" }];
    return new ConflictError("auth:errors.duplicateKey", errors);
  }

  // Add other converters here for libraries like Stripe, AWS SDK, etc.

  return null; // Return null if the error is not a known external type.
}

// Fields that should not have their 'oldValue' exposed in error responses for security reasons.
const SENSITIVE_FIELDS = ["password", "confirmPassword"]; // Define sensitive fields once

/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 */
import type { ErrorRequestHandler } from "express";

/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let apiError = err;

  // If the error is our custom ValidationError, it's already structured correctly.
  // We check for `err.name` and `err.errors` to be resilient against module resolution issues
  // that might prevent `instanceof` from working across module boundaries.
  if (
    apiError.name === "ValidationError" &&
    apiError.errors !== undefined &&
    apiError.statusCode !== undefined
  ) {
    // It's already a ValidationError, no conversion needed.
  } else if (!(apiError instanceof HttpError) && !(apiError instanceof BaseError)) {
    // If it's not our custom ValidationError and not a HttpError/BaseError, try to convert it.
    apiError = convertExternalError(err);

    // If it's still not an HttpError after conversion, it's an unexpected internal error.
    if (apiError === null) {
      apiError = new HttpError(
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        "system:process.errors.unexpected"
      );
    }
  }

  // Log the error with appropriate severity.
  // 5xx errors are logged as 'error', 4xx errors as 'warn'.
  const isServerError = apiError.statusCode >= 500;

  const logMessage = isServerError
    ? "An unexpected server error occurred"
    : "A client error occurred";

  const logData = {
    originalError: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...err,
    },
    apiError,
  };

  if (isServerError) {
    // Use req.log if available (pino-http), otherwise fallback to global logger
    const loggerInstance = req.log ?? errorHandlerLogger;
    loggerInstance.error(logData, logMessage);
  } else {
    const loggerInstance = req.log ?? errorHandlerLogger;
    loggerInstance.warn(logData, logMessage);
  }

  // By now, we always have an HttpError instance in apiError.
  const response = {
    success: false,
    statusCode: apiError.statusCode, // Include statusCode in the response body
    message: req.t(apiError.message, {
      count:
        apiError.errors !== undefined &&
          apiError.errors[0] !== undefined &&
          apiError.errors[0].context !== undefined
          ? apiError.errors[0].context.count
          : undefined,
    }), // Translate the main message with context
    errors: Array.isArray(apiError.errors)
      ? (apiError.errors as Record<string, unknown>[]).map((e) => {
        return {
          field: e.field,
          message: (() => {
            const msgKey = e.issue ?? e.message; // Prioritize e.issue, then e.message
            if (msgKey !== undefined && typeof msgKey === "string") {
              return msgKey.includes(":") ? req.t(msgKey, e.context as Record<string, unknown>) : msgKey;
            }
            return ""; // Default to empty string if no valid message key
          })(),
        };
      })
      : [], // Return empty array if errors is not defined or not an array
    data: (() => {
      /* eslint-disable @typescript-eslint/strict-boolean-expressions */
      if (!req.body) return null;
      const safeData: Record<string, unknown> = {};
      Object.keys(req.body).forEach((key) => {
        if (!SENSITIVE_FIELDS.includes(key)) {
          // eslint-disable-next-line security/detect-object-injection
          safeData[key] = req.body[key];
        }
      });
      return Object.keys(safeData).length > 0 ? safeData : null;
    })(),
  };

  if (!res.headersSent) {
    res.status(apiError.statusCode).json(response);
  }
};
