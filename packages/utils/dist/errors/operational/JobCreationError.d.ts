/**
 * JobCreationError - Job creation failure
 *
 * Thrown when job creation fails.
 */
import { BaseError } from "../base/BaseError.js";
/**
 * Job creation error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new JobCreationError("Failed to create email job", originalError);
 * ```
 */
export declare class JobCreationError extends BaseError {
    constructor(message?: string, cause?: Error);
}
export default JobCreationError;
//# sourceMappingURL=JobCreationError.d.ts.map