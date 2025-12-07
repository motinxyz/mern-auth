/**
 * UnknownJobTypeError - Unknown job type
 *
 * Thrown when processing an unrecognized job type.
 */
import { BaseError } from "./BaseError.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Unknown job type error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new UnknownJobTypeError("invalidJobType");
 * ```
 */
export class UnknownJobTypeError extends BaseError {
    /** The unknown job type that was encountered */
    jobType;
    constructor(jobType, message = "queue:errors.unknownJobType") {
        super(message, ERROR_CODES.UNKNOWN_JOB_TYPE);
        this.jobType = jobType;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            jobType: this.jobType,
        };
    }
}
export default UnknownJobTypeError;
//# sourceMappingURL=UnknownJobTypeError.js.map