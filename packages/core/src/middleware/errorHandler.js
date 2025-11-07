import { logger } from "@auth/config";
import { HTTP_STATUS_CODES, ApiError, ValidationError } from "@auth/utils";

const errorHandlerLogger = logger.child({ module: "errorHandler" });
/**
 * Converts known external errors into a structured ApiError.
 * This acts as an "anti-corruption layer" for errors, ensuring that
 * the rest of the error handler only deals with a consistent error type.
 *
 * @param {Error} err - The error to convert.
 * @returns {ApiError|null} An ApiError instance if the error is recognized, otherwise null.
 */
function convertExternalError(err, req) {
  // Handle Mongoose Validation Errors
  // If the error is a ValidationError from our `validate` middleware, it's already structured correctly.
  if (err instanceof ValidationError) {
    return err;
  }

  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message, // The message from the Mongoose schema is our translation key.
      context: e.properties || e.context, // Use `e.context` if `e.properties` is not available
    }));
    return new ValidationError(errors, req.t);
  }

  // Handle Mongoose Duplicate Key Errors (e.g., unique index violation)
  // Note: This is more robust than the previous implementation in auth.service.js
  if (err.name === "MongoServerError" && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    const errors = [
      { field, message: "validation:email.inUse", context: { value } },
    ];
    return new ApiError(
      HTTP_STATUS_CODES.CONFLICT,
      "validation:email.inUse",
      errors
    );
  }

  // Add other converters here for libraries like Stripe, AWS SDK, etc.

  return null; // Return null if the error is not a known external type.
}

// Fields that should not have their 'oldValue' exposed in error responses for security reasons.
const SENSITIVE_FIELDS = ['password', 'confirmPassword']; // Define sensitive fields once

/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 */
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

  // If the error is not a custom ApiError, convert it.
  if (!(apiError instanceof ApiError)) {
    apiError = convertExternalError(err, req);

    // If it's still not an ApiError, it's an unexpected internal error.
    if (!apiError) {
      apiError = new ApiError(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, "system:process.errors.unexpected");
    }
  }

  // Log the error with appropriate severity.
  // 5xx errors are logged as 'error', 4xx errors as 'warn'.
  const isServerError = apiError.statusCode >= 500;
  const logMethod = isServerError ? "error" : "warn";
  const logMessage = isServerError ? "An unexpected server error occurred" : "A client error occurred";

  errorHandlerLogger[logMethod](
    {
      originalError: err, // The original error object
      apiError, // The final, structured ApiError
    },
    logMessage
  );

  // By now, we always have an ApiError instance in apiError.
  const response = {
    success: false,
    message: req.t(apiError.message), // Translate the main message
    errors: Array.isArray(apiError.errors)
      ? apiError.errors.map((e) => {
          const errorObject = {
            field: e.field,
            message: req.t(e.message, e.context), // Translate detailed error messages
            ...(e.context?.value !== undefined && { value: e.context.value }),
          };

          // Add oldValue if req.body exists and the field is not sensitive
          if (req.body && !SENSITIVE_FIELDS.includes(e.field)) {
            if (req.body[e.field] !== undefined) {
              errorObject.oldValue = req.body[e.field];
            }
          }
          return errorObject;
        })
      : [], // Return empty array if errors is not defined or not an array
  };

  if (!res.headersSent) {
    res.status(apiError.statusCode).json(response);
  }
};
