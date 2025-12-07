/**
 * InvalidJobDataError - Invalid job data
 *
 * Thrown when job data fails validation.
 */
import { BaseError } from "../base/BaseError.js";
import { type ValidationErrorDetail } from "../../types/index.js";
/**
 * Invalid job data error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new InvalidJobDataError("Missing required fields", [
 *   { field: "email", message: "is required" }
 * ]);
 * ```
 */
export declare class InvalidJobDataError extends BaseError {
    /** Validation errors for job data */
    readonly errors: readonly ValidationErrorDetail[];
    constructor(message?: string, errors?: readonly ValidationErrorDetail[]);
    toJSON(): Record<string, unknown>;
}
export default InvalidJobDataError;
//# sourceMappingURL=InvalidJobDataError.d.ts.map