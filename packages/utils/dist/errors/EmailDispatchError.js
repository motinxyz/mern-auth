/**
 * EmailDispatchError - Email sending failure
 *
 * Thrown when email dispatch fails after all retries.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Email dispatch error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new EmailDispatchError("All providers failed", originalError);
 * ```
 */
export class EmailDispatchError extends BaseError {
    constructor(message = "email:errors.dispatchFailed", cause) {
        super(message, ERROR_CODES.EMAIL_ERROR, cause);
    }
}
export default EmailDispatchError;
//# sourceMappingURL=EmailDispatchError.js.map