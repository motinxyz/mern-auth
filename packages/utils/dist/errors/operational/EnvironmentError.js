/**
 * EnvironmentError - Environment variable errors
 *
 * Thrown when required environment variables are missing or invalid.
 */
import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";
/**
 * Environment variable error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new EnvironmentError("Missing required env: DATABASE_URL", ["DATABASE_URL", "REDIS_URL"]);
 * ```
 */
export class EnvironmentError extends BaseError {
    /** List of missing or invalid environment variables */
    missingVariables;
    constructor(message, missingVariables = []) {
        super(message, ERROR_CODES.ENVIRONMENT_ERROR);
        this.missingVariables = missingVariables;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            missingVariables: this.missingVariables,
        };
    }
}
export default EnvironmentError;
//# sourceMappingURL=EnvironmentError.js.map