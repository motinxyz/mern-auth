/**
 * ConflictError - Resource conflict
 *
 * Thrown when a resource already exists or there's a conflict.
 */
import { HttpError } from "./HttpError.js";
import { type ValidationErrorDetail } from "../types/index.js";
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
export declare class ConflictError extends HttpError {
    constructor(message?: string, errors?: readonly ValidationErrorDetail[]);
}
export default ConflictError;
//# sourceMappingURL=ConflictError.d.ts.map