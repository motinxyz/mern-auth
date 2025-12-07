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
  public readonly missingVariables: readonly string[];

  constructor(message: string, missingVariables: readonly string[] = []) {
    super(message, ERROR_CODES.ENVIRONMENT_ERROR);
    this.missingVariables = missingVariables;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      missingVariables: this.missingVariables,
    };
  }
}

export default EnvironmentError;
