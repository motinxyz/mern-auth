/* eslint-disable security/detect-object-injection */
import ApiError from "../ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * EnvironmentError
 * Thrown during application startup if environment configuration is invalid
 *
 * @example
 * throw new EnvironmentError([
 *   { path: ['DATABASE_URL'], message: 'Required' },
 *   { path: ['PORT'], message: 'Must be a number' }
 * ]);
 */

export interface EnvironmentIssue {
  path: string | string[];
  message: string;
}

/**
 * EnvironmentError
 * Thrown during application startup if environment configuration is invalid
 *
 * @example
 * throw new EnvironmentError([
 *   { path: ['DATABASE_URL'], message: 'Required' },
 *   { path: ['PORT'], message: 'Must be a number' }
 * ]);
 */
class EnvironmentError extends ApiError {
  constructor(validationErrors: EnvironmentIssue[] = []) {
    // Convert Zod validation errors to standard format
    const formattedErrors = validationErrors.map((issue) => {
      const field = Array.isArray(issue.path)
        ? issue.path.join(".")
        : issue.path;

      return {
        field,
        message: issue.message,
        value: process.env[field], // Include the invalid value for debugging
      };
    });

    super(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Invalid environment configuration",
      formattedErrors
    );
    this.name = "EnvironmentError";
  }
}


export default EnvironmentError;
