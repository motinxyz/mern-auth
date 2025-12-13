/**
 * InvalidJobDataError - Invalid job data
 *
 * Thrown when job data fails validation.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES, type ValidationErrorDetail } from "../../types/index.js";

/**
 * Invalid job data error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new InvalidJobDataError("Missing required fields", [
 *   { field: "email", message: "is required" }
 * ]);
 * ```
 */
export class InvalidJobDataError extends BaseError {
  /** Validation errors for job data */
  public readonly errors: readonly ValidationErrorDetail[];

  constructor(
    message = "queue:errors.invalidJobData",
    errors: readonly ValidationErrorDetail[] = []
  ) {
    super(message, ERROR_CODES.INVALID_JOB_DATA);
    this.errors = errors;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export default InvalidJobDataError;
