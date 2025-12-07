/**
 * TokenCreationError - Token generation failure
 *
 * Thrown when token creation fails.
 */
import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";
/**
 * Token creation error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new TokenCreationError("Failed to sign JWT", originalError);
 * ```
 */
export class TokenCreationError extends BaseError {
    constructor(message = "token:errors.creationFailed", cause) {
        super(message, ERROR_CODES.INTERNAL_ERROR, cause);
    }
}
export default TokenCreationError;
//# sourceMappingURL=TokenCreationError.js.map