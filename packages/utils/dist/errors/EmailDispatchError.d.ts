/**
 * EmailDispatchError - Email sending failure
 *
 * Thrown when email dispatch fails after all retries.
 */
import { BaseError } from "./BaseError.js";
/**
 * Email dispatch error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new EmailDispatchError("All providers failed", originalError);
 * ```
 */
export declare class EmailDispatchError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default EmailDispatchError;
//# sourceMappingURL=EmailDispatchError.d.ts.map