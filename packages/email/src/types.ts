/**
 * @auth/email Types
 *
 * Production-grade type definitions for email package.
 * All interfaces are readonly for immutability.
 */

import type { ILogger, IEmailLogRepository } from "@auth/contracts";

// ============================================================================
// Constants
// ============================================================================

/**
 * Default circuit breaker configuration for email service
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    volumeThreshold: 20,
    capacity: 50,
} as const;

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Mail options passed to providers
 */
export interface MailOptions {
    readonly from: string;
    readonly to: string;
    readonly subject: string;
    readonly html: string;
    readonly text: string;
}

/**
 * Result from sending an email
 */
export interface EmailResult {
    readonly messageId?: string | undefined;
    readonly provider: string;
    readonly accepted: readonly string[];
    readonly response: string | number;
}

/**
 * Provider health check result
 */
export interface ProviderHealth {
    readonly healthy: boolean;
    readonly name: string;
    readonly error?: string | undefined;
}

/**
 * Webhook headers
 */
export interface WebhookHeaders {
    readonly [key: string]: string | undefined;
}

/**
 * Parsed webhook event
 */
export interface ParsedWebhookEvent {
    readonly timestamp: Date;
    readonly email: string;
    readonly messageId: string;
    readonly type: "bounce" | "complaint" | "delivery";
    readonly bounceType?: "hard" | "soft";
    readonly reason?: string;
    readonly originalEvent: unknown;
}

/**
 * Email provider interface
 */
export interface IEmailProvider {
    readonly name: string;
    send(mailOptions: MailOptions): Promise<EmailResult>;
    verifyWebhookSignature(payload: string, headers: WebhookHeaders, secret?: string | null): boolean;
    parseWebhookEvent(event: unknown): ParsedWebhookEvent | null;
    checkHealth(): Promise<ProviderHealth>;
}

// ============================================================================
// Provider Service Types
// ============================================================================

/**
 * Provider service constructor options
 */
export interface ProviderServiceOptions {
    readonly config: ProviderConfig;
    readonly logger: ILogger;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    readonly resendApiKey?: string | undefined;
    readonly resendWebhookSecret?: string | undefined;
    readonly mailersendApiKey?: string | undefined;
    readonly mailersendWebhookSecret?: string | undefined;
    readonly mailersendEmailFrom?: string | undefined;
}

/**
 * Send options for provider service
 */
export interface SendOptions {
    readonly preferredProvider?: string;
}

/**
 * Provider health result with all providers
 */
export interface ProvidersHealthResult {
    readonly healthy: boolean;
    readonly providers: readonly ProviderHealth[];
}

// ============================================================================
// Email Service Types
// ============================================================================

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
    readonly emailFrom: string;
    readonly clientUrl: string;
    readonly verificationTokenExpiresIn: number;
}

/**
 * Email service constructor options
 */
export interface EmailServiceOptions {
    readonly config: EmailServiceConfig;
    readonly logger: ILogger;
    readonly emailLogRepository: IEmailLogRepository;
    readonly providerService: IProviderService;
    readonly circuitBreakerTimeout?: number;
    readonly circuitBreakerErrorThreshold?: number;
    readonly circuitBreakerResetTimeout?: number;
    readonly circuitBreakerVolumeThreshold?: number;
    readonly circuitBreakerCapacity?: number;
}

/**
 * Send email parameters
 */
export interface SendEmailParams {
    readonly to: string;
    readonly subject?: string;
    readonly html?: string;
    readonly text?: string;
    readonly template?: string;
    readonly data?: Record<string, unknown>;
    readonly userId?: string;
    readonly type?: string;
    readonly metadata?: Record<string, unknown>;
    readonly options?: SendOptions;
}

/**
 * User object for verification emails
 */
export interface EmailUser {
    readonly id: string;
    readonly name: string;
    readonly email: string;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
    totalFires: number;
    totalSuccesses: number;
    totalFailures: number;
    totalTimeouts: number;
    totalRejects: number;
    lastStateChange: string | null;
    circuitOpenTimestamp: number | null;
}

/**
 * Circuit breaker health result
 */
export interface CircuitBreakerHealth {
    readonly initialized: boolean;
    readonly state: "open" | "half-open" | "closed" | "unknown";
    readonly inMemoryStats?: {
        readonly totalFires: number;
        readonly totalSuccesses: number;
        readonly totalFailures: number;
        readonly totalTimeouts: number;
        readonly totalRejects: number;
        readonly successRate: string;
        readonly lastStateChange: string | null;
    };
    readonly circuitBreakerStats?: Record<string, unknown>;
}

/**
 * Overall email service health
 */
export interface EmailServiceHealth {
    readonly healthy: boolean;
    readonly circuitBreaker: CircuitBreakerHealth;
    readonly providers: ProvidersHealthResult;
}

// ============================================================================
// Provider Service Interface (for dependency injection)
// ============================================================================

export interface IProviderService {
    initialize(): Promise<void>;
    sendWithFailover(mailOptions: MailOptions, options?: SendOptions): Promise<EmailResult>;
    getHealth(): Promise<ProvidersHealthResult>;
    getProviders(): readonly IEmailProvider[];
}

// ============================================================================
// Template Engine Types
// ============================================================================

/**
 * Template initialization options
 */
export interface TemplateInitOptions {
    readonly logger?: ILogger;
}

/**
 * Bounce data from webhook
 */
export interface BounceData {
    readonly email: string;
    readonly messageId: string;
    readonly bounceType: "hard" | "soft" | "complaint";
    readonly bounceReason?: string;
    readonly timestamp?: Date;
}

/**
 * Bounce handler result
 */
export interface BounceHandlerResult {
    readonly success: boolean;
    readonly action?: "retry_alternate_provider" | "marked_invalid" | "unsubscribed" | "logged";
    readonly reason?: string;
    readonly emailLog?: unknown;
    readonly user?: unknown;
}

/**
 * Local circuit breaker interface
 */
export interface ICircuitBreaker<TResponse = unknown> {
    fire(...args: unknown[]): Promise<TResponse>;
    fallback(fn: () => void): void;
    on(event: string, listener: (...args: unknown[]) => void): this;
    readonly opened: boolean;
    readonly halfOpen: boolean;
    readonly stats: Record<string, unknown>;
}

// ============================================================================
// Resend Provider Types
// ============================================================================

export interface ResendProviderOptions {
    readonly apiKey?: string | undefined;
    readonly webhookSecret?: string | undefined;
    readonly logger: ILogger;
}

// ============================================================================
// MailerSend Provider Types
// ============================================================================

export interface MailerSendProviderOptions {
    readonly apiKey?: string | undefined;
    readonly webhookSecret?: string | undefined;
    readonly fromEmail?: string | undefined;
    readonly logger: ILogger;
}
