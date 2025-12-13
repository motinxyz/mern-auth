/**
 * API Error Response Interface
 *
 * Standard shape for all error API responses.
 *
 * @example
 * ```typescript
 * const error: IApiError = {
 *   success: false,
 *   statusCode: 400,
 *   message: "Validation failed",
 *   code: "VALIDATION_ERROR",
 *   errors: [{ field: "email", message: "Invalid email" }],
 *   data: null
 * };
 * ```
 */

import type { IValidationErrorDetail } from "./validation-error-detail.js";

export interface IApiError {
    /** Always false for error responses */
    readonly success: false;
    /** HTTP status code */
    readonly statusCode: number;
    /** Error message (can be i18n key) */
    readonly message: string;
    /** Machine-readable error code */
    readonly code: string;
    /** Validation errors or additional details */
    readonly errors: readonly IValidationErrorDetail[];
    /** Always null for error responses */
    readonly data: null;
}
