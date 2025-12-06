/**
 * Email send options
 */
export interface MailOptions {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Result from sending an email
 */
export interface EmailSendResult {
    messageId: string;
    provider: string;
    accepted?: string[];
    response?: number;
}

/**
 * Parsed bounce/complaint data from webhooks
 */
export interface BounceData {
    type?: "bounce" | "complaint";
    bounceType?: "soft" | "hard";
    email: string;
    messageId: string;
    reason?: string;
    timestamp: Date;
    originalEvent?: unknown;
}

/**
 * Health check result
 */
export interface ProviderHealthResult {
    healthy: boolean;
    name: string;
    error?: string;
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
        headers: Record<string, string | string[] | undefined>
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
