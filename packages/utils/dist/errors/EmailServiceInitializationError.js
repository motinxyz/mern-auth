/**
 * EmailServiceInitializationError - Email service startup failure
 *
 * Thrown when email service fails to initialize.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Email service initialization error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new EmailServiceInitializationError("No providers configured", originalError);
 * ```
 */
export class EmailServiceInitializationError extends BaseError {
    constructor(message = "email:errors.initFailed", cause) {
        super(message, ERROR_CODES.CONFIGURATION_ERROR, cause);
    }
}
export default EmailServiceInitializationError;
//# sourceMappingURL=EmailServiceInitializationError.js.map