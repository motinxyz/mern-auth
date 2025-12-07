import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * ValidationError
 * Thrown when request validation fails
 *
 * @example
 * throw new ValidationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'password', message: 'Password too short' }
 * ]);
 */

export interface ZodIssue {
  path: string | string[];
  message: string;
}

export interface CustomIssue {
  field?: string;
  message: string;
  context?: Record<string, unknown>;
}

export type ValidationIssue = ZodIssue | CustomIssue;

/**
 * ValidationError
 * Thrown when request validation fails
 *
 * @example
 * throw new ValidationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'password', message: 'Password too short' }
 * ]);
 */
class ValidationError extends ApiError {
  constructor(errors: ValidationIssue[] = [], message = "Validation failed") {
    // Process the errors array to ensure consistent format
    const formattedErrors = errors.map((err) => {
      // Support both Zod error format and custom format
      if ("path" in err) {
        // Zod format
        return {
          field: Array.isArray(err.path) ? err.path.join(".") : err.path,
          message: err.message,
        };
      }
      // Custom format
      const customErr = err as CustomIssue;
      return {
        field: customErr.field ?? "unknown",
        message: customErr.message ?? "Validation error",
        context: customErr.context, // Preserve context for i18n interpolation
      };
    });

    super(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT, message, formattedErrors);
    this.name = "ValidationError";
  }
}

export default ValidationError;

