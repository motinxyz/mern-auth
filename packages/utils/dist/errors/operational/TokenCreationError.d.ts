/**
 * TokenCreationError - Token generation failure
 *
 * Thrown when token creation fails.
 */
import { BaseError } from "../base/BaseError.js";
/**
 * Token creation error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new TokenCreationError("Failed to sign JWT", originalError);
 * ```
 */
export declare class TokenCreationError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default TokenCreationError;
//# sourceMappingURL=TokenCreationError.d.ts.map