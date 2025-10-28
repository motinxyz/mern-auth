import ApiError from "../core/api/ApiError.js";
import { HTTP_STATUS_CODES } from "../constants/httpStatusCodes.js";

/**
 * Custom error for handling invalid environment variables.
 * This error is thrown during application startup if the configuration is invalid.
 */
class EnvironmentError extends ApiError {
  constructor(validationErrors = {}) {
    // Convert the validationErrors object into the standard error format.
    // This now processes the `issues` array from a ZodError.
    const formattedErrors = validationErrors.map((issue) => {
      const field = issue.path.join(".");
      try {
        // Attempt to parse the message as a JSON object for i18n
        const parsed = JSON.parse(issue.message);
        return {
          field,
          message: parsed.message, // The translation key
          value: process.env[field], // Include the invalid value
          context: parsed.params || {}, // The interpolation params
        };
      } catch (e) {
        // Fallback for non-JSON messages
        return { field, message: issue.message, value: process.env[field] };
      }
    });

    super(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      "system:process.errors.invalidEnvVars",
      formattedErrors
    );
    this.name = "EnvironmentError";
  }
}

export default EnvironmentError;
