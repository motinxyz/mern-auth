/**
 * @auth/contracts - Email Template Types
 *
 * Available email template identifiers for type-safe template selection.
 */

/**
 * Available email template names.
 *
 * Add new template names here when creating new email templates.
 * This provides type-safe autocomplete and prevents template name typos.
 *
 * @example
 * ```typescript
 * sendEmail({ template: "verification", data: {...} });
 * ```
 */
export type EmailTemplate =
    | "verification"
    | "welcome"
    | "password-reset"
    | "password-changed"
    | "account-locked"
    | "login-alert"
    | "notification";
