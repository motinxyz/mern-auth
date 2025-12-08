/**
 * @auth/contracts - Email Provider Interface
 *
 * Defines contracts for email provider adapters (Resend, MailerSend, etc.).
 * Providers implement this interface for consistent email operations.
 */

import type { IHealthResult, BounceType } from "./common.js";

// =============================================================================
// Email Options
// =============================================================================

/**
 * Email composition options.
 */
export interface MailOptions {
    /** Recipient email address */
    readonly to: string;
    /** Sender email address */
    readonly from: string;
    /** Email subject line */
    readonly subject: string;
    /** HTML content body */
    readonly html: string;
    /** Plain text content (optional fallback) */
    readonly text?: string | undefined;
}

// =============================================================================
// Email Results
// =============================================================================

/**
 * Result from successfully sending an email.
 */
export interface EmailSendResult {
    /** Provider-generated message ID */
    readonly messageId: string;
    /** Name of the provider that sent the email */
    readonly provider: string;
    /** List of accepted recipient addresses */
    readonly accepted?: readonly string[] | undefined;
    /** HTTP response code from the provider */
    readonly response?: number | undefined;
}

/**
 * Parsed bounce/complaint event data from webhooks.
 */
export interface BounceData {
    /** Type of event (bounce or spam complaint) */
    readonly type?: "bounce" | "complaint" | undefined;
    /** Bounce classification (soft = temporary, hard = permanent) */
    readonly bounceType?: BounceType | undefined;
    /** Affected email address */
    readonly email: string;
    /** Provider message ID for correlation */
    readonly messageId: string;
    /** Human-readable bounce reason */
    readonly reason?: string | undefined;
    /** When the bounce/complaint occurred */
    readonly timestamp: Date;
    /** Original provider event for debugging */
    readonly originalEvent?: unknown;
}

// =============================================================================
// Provider Health
// =============================================================================

/**
 * Email provider health check result.
 */
export interface ProviderHealthResult extends IHealthResult {
    /** Provider name (e.g., 'resend', 'mailersend') */
    readonly name: string;
}

// =============================================================================
// Email Provider Interface
// =============================================================================

/**
 * Interface for email provider adapters.
 *
 * Each email provider (Resend, MailerSend, SES, etc.) implements this
 * interface to provide consistent email operations and webhook handling.
 *
 * @example
 * ```typescript
 * const result = await provider.send({
 *   to: 'user@example.com',
 *   from: 'noreply@yourapp.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Welcome to our app</h1>',
 * });
 * ```
 */
export interface IEmailProvider {
    /** Provider name for identification and logging */
    readonly name: string;

    /**
     * Send an email.
     *
     * @param mailOptions - Email composition options
     * @returns Result with message ID and provider info
     * @throws Error if sending fails
     */
    send(mailOptions: MailOptions): Promise<EmailSendResult>;

    /**
     * Verify webhook signature authenticity.
     *
     * @param payload - Raw webhook request body
     * @param headers - Request headers (signature, timestamp, etc.)
     * @returns true if signature is valid
     */
    verifyWebhookSignature(
        payload: string,
        headers: Readonly<Record<string, string | string[] | undefined>>
    ): boolean;

    /**
     * Parse a webhook event into standardized bounce data.
     *
     * @param event - Raw webhook event payload
     * @returns Parsed bounce data or null if not a bounce/complaint
     */
    parseWebhookEvent(event: unknown): BounceData | null;

    /**
     * Check provider health/connectivity.
     *
     * @returns Health status with provider name
     */
    checkHealth(): Promise<ProviderHealthResult>;
}
