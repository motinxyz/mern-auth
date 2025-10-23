import logger from "../config/logger.js";
import { ApiError, ValidationError } from "../errors/index.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * Express error handling middleware.
 * This middleware centralizes error handling and formats the error response.
 * It should be the last middleware in the chain.
 */
export const errorHandler = (err, req, res, next) => {
  let apiError = err;

  // Log the original error for debugging
  logger.error(err);

  // If the error is not a custom ApiError, convert it.
  if (!(err instanceof ApiError)) {
    // Handle Mongoose Validation Errors specifically
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message, // Use the message from Mongoose, which is our translation key
        context: e.properties, // e.properties contains value, minlength, etc.
      }));
      apiError = new ValidationError(errors);
    }
    // Handle Joi validation errors
    else if (err.isJoi) {
      const errors = err.details.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        context: e.context,
      }));
      apiError = new ApiError(HTTP_STATUS_CODES.BAD_REQUEST, 'Validation failed', errors);
    }
    // Handle all other unexpected errors
    else {
      const statusCode = err.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
      const message = err.message || 'errors.serverError';
      apiError = new ApiError(statusCode, message, [], process.env.NODE_ENV === 'development' ? err.stack : undefined);
    }
  }

  // By now, we always have an ApiError instance in apiError.
  const response = {
    success: false,
    message: req.t(apiError.message), // Translate the main message
    errors: apiError.errors.map((e) => ({
      field: e.field,
      message: req.t(e.message, e.context || {}), // Translate detailed error messages
      ...(e.context && e.context.value && { value: e.context.value }),
    })),
  };

  if (!res.headersSent) {
    res.status(apiError.statusCode).json(response);
  }
};
