/**
 * JobCreationError - Job creation failure
 *
 * Thrown when job creation fails.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Job creation error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new JobCreationError("Failed to create email job", originalError);
 * ```
 */
export class JobCreationError extends BaseError {
  constructor(message = "queue:errors.jobCreationFailed", cause?: Error) {
    super(message, ERROR_CODES.JOB_FAILED, cause);
  }
}

export default JobCreationError;
