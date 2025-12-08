/**
 * TooManyRequestsError - Rate limit exceeded
 *
 * Thrown when a client exceeds the rate limit.
 */

import { HttpError } from "../base/HttpError.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Rate limit error (429)
 *
 * @example
 * ```typescript
 * throw new TooManyRequestsError(60); // Retry after 60 seconds
 * ```
 */
export class TooManyRequestsError extends HttpError {
  /** Seconds until the client can retry */
  public readonly retryAfter: number;

  constructor(retryAfterSeconds = 60, message = "system:process.errors.tooManyRequests") {
    super(
      HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
      message,
      ERROR_CODES.TOO_MANY_REQUESTS
    );
    this.retryAfter = retryAfterSeconds;
  }
}

export default TooManyRequestsError;
