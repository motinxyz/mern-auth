/**
 * HTTP Module
 *
 * Centralized HTTP-related utilities including status codes and response classes.
 * Re-exports from individual files for cleaner organization.
 */

// Status codes (re-exported from @auth/contracts)
export {
    HTTP_STATUS_CODES,
    isHttpStatusCode,
    type HttpStatusCode,
} from "./status-codes.js";

// API Response class
export { ApiResponse } from "./api-response.js";

// Re-export interfaces from contracts for convenience
// Note: ApiResponseType is already exported from ./types/index.js
export type {
    IApiResponse,
    IApiError,
    IValidationErrorDetail,
} from "@auth/contracts";
