/**
 * NotFoundError - Resource not found
 *
 * Thrown when a requested resource does not exist.
 */
import { HttpError } from "../base/HttpError.js";
/**
 * Not found error (404)
 *
 * @example
 * ```typescript
 * throw new NotFoundError("system:errors.userNotFound");
 * ```
 */
export declare class NotFoundError extends HttpError {
    constructor(message?: string);
}
export default NotFoundError;
//# sourceMappingURL=NotFoundError.d.ts.map