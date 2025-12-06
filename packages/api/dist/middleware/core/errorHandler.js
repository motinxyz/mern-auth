import { getLogger } from "@auth/config";
const logger = getLogger();
import { HTTP_STATUS_CODES, ApiError, ValidationError, ConflictError, } from "@auth/utils";
const errorHandlerLogger = logger.child({ module: "errorHandler" });
/**
 * Converts known external errors into a structured ApiError.
 * This acts as an "anti-corruption layer" for errors, ensuring that
 * the rest of the error handler only deals with a consistent error type.
 *
 * @param {Error} err - The error to convert.
 * @returns {ApiError|null} An ApiError instance if the error is recognized, otherwise null.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertExternalError(err, req) {
    // Handle Mongoose Validation Errors
    // If the error is a ValidationError from our `validate` middleware, it's already structured correctly.
    if (err instanceof ValidationError) {
        return err;
    }
    if (err.name === "ValidationError" && err.errors) {
        const errors = Object.values(err.errors).map((e) => {
            const context = e.properties || e.context || {};
            // Map Mongoose properties to translation keys
            if (context.minlength)
                context.count = context.minlength;
            if (context.maxlength)
                context.count = context.maxlength;
            return {
                field: e.path,
                message: e.message, // The message from the Mongoose schema is our translation key.
                context, // Use `e.context` if `e.properties` is not available
            };
        });
        return new ValidationError(errors, "validation:failed");
    }
    // Handle Mongoose Duplicate Key Errors (e.g., unique index violation)
    if (err.name === "MongoServerError" && err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        // eslint-disable-next-line security/detect-object-injection
        const value = err.keyValue[field];
        const errors = [{ field, issue: "validation:duplicateValue", value }];
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
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const errorHandler = (err, req, res, next) => {
    let apiError = err;
    // If the error is our custom ValidationError, it's already structured correctly.
    // We check for `err.name` and `err.errors` to be resilient against module resolution issues
    // that might prevent `instanceof` from working across module boundaries.
    if (apiError.name === "ValidationError" &&
        apiError.errors &&
        apiError.statusCode) {
        // It's already a ValidationError, no conversion needed.
    }
    else if (!(apiError instanceof ApiError)) {
        // If it's not our custom ValidationError and not a generic ApiError, try to convert it.
        apiError = convertExternalError(err, req);
        // If it's still not an ApiError after conversion, it's an unexpected internal error.
        if (!apiError) {
            apiError = new ApiError(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, "system:process.errors.unexpected");
        }
    }
    // Log the error with appropriate severity.
    // 5xx errors are logged as 'error', 4xx errors as 'warn'.
    const isServerError = apiError.statusCode >= 500;
    const logMethod = isServerError ? "error" : "warn";
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
        const loggerInstance = req.log || errorHandlerLogger;
        loggerInstance.error(logData, logMessage);
    }
    else {
        const loggerInstance = req.log || errorHandlerLogger;
        loggerInstance.warn(logData, logMessage);
    }
    // By now, we always have an ApiError instance in apiError.
    const response = {
        success: false,
        statusCode: apiError.statusCode, // Include statusCode in the response body
        message: req.t(apiError.message, {
            count: apiError.errors && apiError.errors[0] && apiError.errors[0].context
                ? apiError.errors[0].context.count
                : undefined,
        }), // Translate the main message with context
        errors: Array.isArray(apiError.errors)
            ? apiError.errors.map((e) => {
                return {
                    field: e.field,
                    message: (() => {
                        const msgKey = e.issue || e.message; // Prioritize e.issue, then e.message
                        if (msgKey && typeof msgKey === "string") {
                            return msgKey.includes(":") ? req.t(msgKey, e.context) : msgKey;
                        }
                        return ""; // Default to empty string if no valid message key
                    })(),
                };
            })
            : [], // Return empty array if errors is not defined or not an array
        data: (() => {
            if (!req.body)
                return null;
            const safeData = {};
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
//# sourceMappingURL=errorHandler.js.map