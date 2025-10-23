import { validationResult } from "express-validator";
import { ValidationError } from "../errors/index.js";

/**
 * Middleware to validate request using express-validator.
 * If validation errors exist, it formats them and passes them to the next error handler.
 * @returns {Function} Express middleware function.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format the errors from express-validator
  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg, // The message is the translation key
    context: { value: err.value }, // Standardize the error structure
  }));

  // Throw a standardized validation error
  throw new ValidationError(extractedErrors);
};


export default validate;
