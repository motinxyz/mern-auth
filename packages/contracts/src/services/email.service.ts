/**
 * @auth/contracts - Email Service Interface
 *
 * Defines contracts for email sending operations with template support,
 * provider failover, and circuit breaker patterns.
 */

import type { ILogger } from "../core/logger.interface.js";
import type { IConfig } from "../core/config.interface.js";
import type { IEmailLogRepository } from "../repositories/email-log.repository.js";
import type { IEmailProvider, MailOptions, EmailSendResult } from "./email-provider.interface.js";
import type { CircuitBreakerState } from "../common/index.js";
import type { EmailTemplate } from "./email-templates.js";

// =============================================================================
// Email Service Configuration
// =============================================================================

/**
 * Dependencies required to initialize an EmailService.
 */
export interface EmailServiceOptions {
    /** Application configuration */
    readonly config: IConfig;
    /** Logger instance for email operations */
    readonly logger: ILogger;
    /** Optional repository for logging email events */
    readonly emailLogRepository?: IEmailLogRepository | undefined;
    /** Optional provider service for multi-provider failover */
    readonly providerService?: IProviderService | undefined;
}

// =============================================================================
// Email Send Options
// =============================================================================

/**
 * Options for sending a templated email.
 */
export interface SendEmailOptions {
    /** Recipient email address */
    readonly to: string;
    /** Template name to use - must be a valid EmailTemplate */
    readonly template: EmailTemplate;
    /** Dynamic data to inject into the template */
    readonly data: Readonly<Record<string, unknown>>;
    /** Recipient's locale for i18n (e.g., 'en', 'es') */
    readonly locale?: string | undefined;
    /** Preferred email provider to use */
    readonly preferredProvider?: string | undefined;
}

/**
 * Options for sending verification emails.
 */
export interface VerificationEmailOptions {
    /** Preferred email provider to use */
    readonly preferredProvider?: string | undefined;
}

// =============================================================================
// Email Service Results
// =============================================================================

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

// =============================================================================
// Circuit Breaker Health
// =============================================================================

/**
 * Health status of the email service circuit breaker.
 */
export interface CircuitBreakerHealth {
    /** Whether the circuit breaker has been initialized */
    readonly initialized: boolean;
    /** Current state of the circuit breaker */
    readonly state: CircuitBreakerState;
    /** In-memory statistics for monitoring */
    readonly inMemoryStats?: {
        readonly totalFires: number;
        readonly totalSuccesses: number;
        readonly totalFailures: number;
        readonly totalTimeouts: number;
        readonly totalRejects: number;
        readonly successRate: string;
        readonly lastStateChange: string | null;
    } | undefined;
    /** Raw circuit breaker statistics from the library */
    readonly circuitBreakerStats?: Readonly<Record<string, unknown>> | undefined;
}

// =============================================================================
// Provider Service Interface
// =============================================================================

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

// =============================================================================
// Email Service Interface
// =============================================================================

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
