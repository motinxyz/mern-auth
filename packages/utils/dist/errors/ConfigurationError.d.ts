/**
 * ConfigurationError - Configuration/setup error
 *
 * Thrown when there's a configuration or initialization issue.
 */
import { BaseError } from "./BaseError.js";
/**
 * Configuration error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new ConfigurationError("Missing required config: DATABASE_URL");
 * ```
 */
export declare class ConfigurationError extends BaseError {
    constructor(message: string, cause?: Error);
}
export default ConfigurationError;
//# sourceMappingURL=ConfigurationError.d.ts.map