/**
 * ConflictError - Resource conflict
 *
 * Thrown when a resource already exists or there's a conflict.
 */
import { HttpError } from "./HttpError.js";
import { HTTP_STATUS_CODES } from "../http/index.js";
import { ERROR_CODES } from "../types/index.js";
/**
 * Conflict error (409)
 *
 * @example
 * ```typescript
 * throw new ConflictError("validation:email.inUse", [
 *   { field: "email", message: "validation:email.inUse" }
 * ]);
 * ```
 */
export class ConflictError extends HttpError {
    constructor(message = "system:errors.conflict", errors = []) {
        super(HTTP_STATUS_CODES.CONFLICT, message, ERROR_CODES.CONFLICT, errors);
    }
}
export default ConflictError;
//# sourceMappingURL=ConflictError.js.map