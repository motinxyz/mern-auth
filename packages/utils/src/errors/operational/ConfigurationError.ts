/**
 * ConfigurationError - Configuration/setup error
 *
 * Thrown when there's a configuration or initialization issue.
 */

import { BaseError } from "../base/BaseError.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Configuration error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new ConfigurationError("Missing required config: DATABASE_URL");
 * ```
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, ERROR_CODES.CONFIGURATION_ERROR, cause);
  }
}

export default ConfigurationError;
