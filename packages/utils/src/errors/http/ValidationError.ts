/**
 * ValidationError - Request validation failures
 *
 * Thrown when request data fails validation (Zod, custom, etc.)
 */

import { HttpError } from "../base/HttpError.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import {
  ERROR_CODES,
  type ValidationErrorDetail,
  type ValidationIssue,
} from "../../types/index.js";

/**
 * Validation error for failed input validation
 *
 * @example
 * ```typescript
 * throw new ValidationError([
 *   { field: 'email', message: 'validation:email.invalid' },
 *   { field: 'password', message: 'validation:password.length' }
 * ]);
 * ```
 */
export class ValidationError extends HttpError {
  constructor(
    issues: readonly ValidationIssue[] = [],
    message = "validation:failed"
  ) {
    const errors = ValidationError.formatIssues(issues);
    super(
      HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT,
      message,
      ERROR_CODES.VALIDATION_FAILED,
      errors
    );
  }

  /**
   * Convert validation issues to consistent format
   */
  private static formatIssues(
    issues: readonly ValidationIssue[]
  ): readonly ValidationErrorDetail[] {
    return issues.map((issue): ValidationErrorDetail => {
      // Zod format: has 'path' property
      if ("path" in issue) {
        const path = issue.path;
        return {
          field: Array.isArray(path) ? path.join(".") : String(path),
          message: issue.message,
        };
      }
      // Custom format
      const result: ValidationErrorDetail = {
        field: issue.field ?? "unknown",
        message: issue.message ?? "validation:error",
      };
      if (issue.context !== undefined) {
        return { ...result, context: issue.context };
      }
      return result;
    });
  }
}

export default ValidationError;
