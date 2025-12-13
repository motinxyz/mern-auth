import type { EmailSendResult, IEmailProvider, MailOptions } from "../services/email-provider.interface.js";

/**
 * Interface for email provider orchestration with failover support.
 *
 * Manages multiple email providers and handles automatic failover
 * when primary providers are unavailable.
 */
export interface IProviderService {
    /**
     * Initialize all configured email providers.
     */
    initialize(): Promise<void>;

    /**
     * Send an email with automatic failover to backup providers.
     *
     * @param mailOptions - Email composition options
     * @param options - Optional preferences (e.g., preferred provider)
     * @returns Result from the successful provider
     * @throws Error if all providers fail
     */
    sendWithFailover(
        mailOptions: MailOptions,
        options?: { readonly preferredProvider?: string | undefined }
    ): Promise<EmailSendResult>;

    /**
     * Get the number of configured providers.
     */
    getProviderCount(): number;

    /**
     * Get all configured provider instances.
     */
    getProviders(): readonly IEmailProvider[];
}
