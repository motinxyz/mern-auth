/**
 * Validation Error Detail
 *
 * Represents a single field-level validation error.
 */

export interface IValidationErrorDetail {
    /** Field that caused the error (optional for general errors) */
    readonly field?: string;
    /** Human-readable error message */
    readonly message: string;
}
