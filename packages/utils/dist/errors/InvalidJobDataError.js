/**
 * InvalidJobDataError - Invalid job data
 *
 * Thrown when job data fails validation.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
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
export class InvalidJobDataError extends BaseError {
    /** Validation errors for job data */
    errors;
    constructor(message = "queue:errors.invalidJobData", errors = []) {
        super(message, ERROR_CODES.INVALID_JOB_DATA);
        this.errors = errors;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            errors: this.errors,
        };
    }
}
export default InvalidJobDataError;
//# sourceMappingURL=InvalidJobDataError.js.map