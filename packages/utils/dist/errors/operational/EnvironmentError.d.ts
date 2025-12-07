/**
 * EnvironmentError - Environment variable errors
 *
 * Thrown when required environment variables are missing or invalid.
 */
import { BaseError } from "../base/BaseError.js";
/**
 * Environment variable error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new EnvironmentError("Missing required env: DATABASE_URL", ["DATABASE_URL", "REDIS_URL"]);
 * ```
 */
export declare class EnvironmentError extends BaseError {
    /** List of missing or invalid environment variables */
    readonly missingVariables: readonly string[];
    constructor(message: string, missingVariables?: readonly string[]);
    toJSON(): Record<string, unknown>;
}
export default EnvironmentError;
//# sourceMappingURL=EnvironmentError.d.ts.map