/**
 * UnknownJobTypeError - Unknown job type
 *
 * Thrown when processing an unrecognized job type.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Unknown job type error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new UnknownJobTypeError("invalidJobType");
 * ```
 */
export class UnknownJobTypeError extends BaseError {
  /** The unknown job type that was encountered */
  public readonly jobType: string;

  constructor(jobType: string, message = "queue:errors.unknownJobType") {
    super(message, ERROR_CODES.UNKNOWN_JOB_TYPE);
    this.jobType = jobType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      jobType: this.jobType,
    };
  }
}

export default UnknownJobTypeError;
