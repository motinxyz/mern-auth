import type { CircuitBreakerHealth } from "./circuit-breaker.interface.js";
import type { SendEmailOptions, VerificationEmailOptions } from "./send-options.interface.js";
import type { EmailServiceResult } from "./service-result.interface.js";

/**
 * Interface for email sending operations.
 *
 * Provides high-level email sending capabilities with template support,
 * i18n, logging, and circuit breaker patterns for resilience.
 *
 * @example
 * ```typescript
 * const result = await emailService.sendEmail({
 *   to: 'user@example.com',
 *   template: 'welcome',
 *   data: { name: 'John' },
 *   locale: 'en',
 * });
 * ```
 */
export interface IEmailService {
    /**
     * Initialize the email service and all providers.
     */
    initialize(): Promise<void>;

    /**
     * Send a templated email.
     *
     * @param options - Email send options including template and data
     * @returns Result with message ID and provider information
     */
    sendEmail(options: SendEmailOptions): Promise<EmailServiceResult>;

    /**
     * Send a verification email to a user.
     *
     * Convenience method that handles verification email template selection
     * and token URL generation.
     *
     * @param user - User to send verification to
     * @param token - Verification token
     * @param locale - Optional locale for i18n
     * @param options - Optional provider preferences
     * @returns Result with message ID and provider information
     */
    sendVerificationEmail(
        user: { readonly id: string; readonly email: string; readonly name: string },
        token: string,
        locale?: string,
        options?: VerificationEmailOptions
    ): Promise<EmailServiceResult>;

    /**
     * Get health status of the circuit breaker.
     */
    getCircuitBreakerHealth(): CircuitBreakerHealth;
}
