/**
 * HTTP Module - Barrel Export
 *
 * Clean re-exports from individual files.
 * Each concept lives in its own file.
 */

// Status codes
export {
    HTTP_STATUS_CODES,
    isHttpStatusCode,
    type HttpStatusCode,
} from "./status-codes.js";

// Validation error detail
export type { IValidationErrorDetail } from "./validation-error-detail.js";

// API response interfaces
export type { IApiResponse } from "./api-response.interface.js";
export type { IAuthenticatedUser } from "./authenticated-user.interface.js";
export type { IApiError } from "./api-error.interface.js";
export type { ApiResponseType } from "./api-response-type.js";
