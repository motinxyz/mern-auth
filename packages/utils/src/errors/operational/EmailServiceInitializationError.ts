/**
 * EmailServiceInitializationError - Email service startup failure
 *
 * Thrown when email service fails to initialize.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Email service initialization error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new EmailServiceInitializationError("No providers configured", originalError);
 * ```
 */
export class EmailServiceInitializationError extends BaseError {
  constructor(message = "email:errors.initFailed", cause?: Error) {
    super(message, ERROR_CODES.CONFIGURATION_ERROR, cause);
  }
}

export default EmailServiceInitializationError;