/**
 * UnknownJobTypeError - Unknown job type
 *
 * Thrown when processing an unrecognized job type.
 */
import { BaseError } from "./BaseError.js";
/**
 * Unknown job type error (non-HTTP, operational)
 *
 * @example
 * ```typescript
 * throw new UnknownJobTypeError("invalidJobType");
 * ```
 */
export declare class UnknownJobTypeError extends BaseError {
    /** The unknown job type that was encountered */
    readonly jobType: string;
    constructor(jobType: string, message?: string);
    toJSON(): Record<string, unknown>;
}
export default UnknownJobTypeError;
//# sourceMappingURL=UnknownJobTypeError.d.ts.map