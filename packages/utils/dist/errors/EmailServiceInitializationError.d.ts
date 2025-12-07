/**
 * EmailServiceInitializationError - Email service startup failure
 *
 * Thrown when email service fails to initialize.
 */
import { BaseError } from "./BaseError.js";
/**
 * Email service initialization error (non-HTTP, critical)
 *
 * @example
 * ```typescript
 * throw new EmailServiceInitializationError("No providers configured", originalError);
 * ```
 */
export declare class EmailServiceInitializationError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default EmailServiceInitializationError;
//# sourceMappingURL=EmailServiceInitializationError.d.ts.map