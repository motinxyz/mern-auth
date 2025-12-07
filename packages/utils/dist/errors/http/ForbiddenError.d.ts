/**
 * ForbiddenError (403)
 *
 * Thrown when the user is authenticated but does not have permission to access the resource.
 */
import { type ValidationErrorDetail } from "../../types/index.js";
import { HttpError } from "../base/HttpError.js";
export declare class ForbiddenError extends HttpError {
    constructor(message?: string, errors?: readonly ValidationErrorDetail[], cause?: Error);
}
//# sourceMappingURL=ForbiddenError.d.ts.map