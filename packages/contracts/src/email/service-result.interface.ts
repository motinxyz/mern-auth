/**
 * Result from sending an email via EmailService.
 * Extends provider result with optional logging metadata.
 */
export interface EmailServiceResult {
    /** Provider-generated message ID (may be undefined if simulated) */
    readonly messageId?: string | undefined;
    /** Name of the provider that sent the email */
    readonly provider: string;
    /** List of accepted email addresses */
    readonly accepted?: readonly string[] | undefined;
    /** HTTP response code or status string */
    readonly response?: number | string | undefined;
    /** ID of the email log entry in the database */
    readonly emailLogId?: string | undefined;
}
