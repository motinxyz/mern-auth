/**
 * NotFoundError - Resource not found
 *
 * Thrown when a requested resource does not exist.
 */

import { HttpError } from "../base/HttpError.js";
import { HTTP_STATUS_CODES } from "../../http/index.js";
import { ERROR_CODES } from "../../types/index.js";

/**
 * Not found error (404)
 *
 * @example
 * ```typescript
 * throw new NotFoundError("system:errors.userNotFound");
 * ```
 */
export class NotFoundError extends HttpError {
  constructor(message = "system:errors.notFound") {
    super(HTTP_STATUS_CODES.NOT_FOUND, message, ERROR_CODES.NOT_FOUND);
  }
}

export default NotFoundError;
