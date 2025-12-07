/**
 * IEmailProvider - Interface for email provider adapters
 *
 * Implementations: ResendProvider, MailerSendProvider
 */

/**
 * Email send options
 */
export interface MailOptions {
    readonly to: string;
    readonly from: string;
    readonly subject: string;
    readonly html: string;
    readonly text?: string;
}

/**
 * Result from sending an email
 */
export interface EmailSendResult {
    readonly messageId: string;
    readonly provider: string;
    readonly accepted?: readonly string[];
    readonly response?: number;
}

/**
 * Parsed bounce/complaint data from webhooks
 */
export interface BounceData {
    readonly type?: "bounce" | "complaint";
    readonly bounceType?: "soft" | "hard";
    readonly email: string;
    readonly messageId: string;
    readonly reason?: string;
    readonly timestamp: Date;
    readonly originalEvent?: unknown;
}

/**
 * Health check result
 */
export interface ProviderHealthResult {
    readonly healthy: boolean;
    readonly name: string;
    readonly error?: string;
}

/**
 * Interface for Email Providers
 */
export interface IEmailProvider {
    /**
     * Provider name (e.g. 'resend', 'mailersend')
     */
    readonly name: string;

    /**
     * Send an email
     */
    send(mailOptions: MailOptions): Promise<EmailSendResult>;

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(
        payload: string,
        headers: Readonly<Record<string, string | string[] | undefined>>
    ): boolean;

    /**
     * Parse webhook event into standardized format
     */
    parseWebhookEvent(event: unknown): BounceData | null;

    /**
     * Check provider health
     */
    checkHealth(): Promise<ProviderHealthResult>;
}
