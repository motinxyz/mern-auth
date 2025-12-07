/**
 * TooManyRequestsError - Rate limit exceeded
 *
 * Thrown when a client exceeds the rate limit.
 */
import { HttpError } from "./HttpError.js";
/**
 * Rate limit error (429)
 *
 * @example
 * ```typescript
 * throw new TooManyRequestsError(60); // Retry after 60 seconds
 * ```
 */
export declare class TooManyRequestsError extends HttpError {
    /** Seconds until the client can retry */
    readonly retryAfter: number;
    constructor(retryAfterSeconds?: number, message?: string);
}
export default TooManyRequestsError;
//# sourceMappingURL=TooManyRequestsError.d.ts.map