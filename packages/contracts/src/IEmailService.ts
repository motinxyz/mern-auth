import type { ILogger } from "./ILogger.js";
import type { IConfig } from "./IConfig.js";
import type { IEmailLogRepository } from "./IDatabase.js";
import type { IEmailProvider, MailOptions, EmailSendResult } from "./IEmailProvider.js";

/**
 * Email service options
 */
export interface EmailServiceOptions {
    config: IConfig;
    logger: ILogger;
    emailLogRepository?: IEmailLogRepository | undefined;
    providerService?: IProviderService | undefined;
}

/**
 * Email send options
 */
export interface SendEmailOptions {
    to: string;
    template: string;
    data: Record<string, unknown>;
    locale?: string | undefined;
    preferredProvider?: string | undefined;
}

/**
 * Verification email options
 */
export interface VerificationEmailOptions {
    preferredProvider?: string | undefined;
}

/**
 * Email result type from EmailService (allows optional messageId and emailLogId)
 */
export interface EmailServiceResult {
    readonly messageId?: string | undefined;
    readonly provider: string;
    readonly accepted?: readonly string[] | undefined;
    readonly response?: number | string | undefined;
    readonly emailLogId?: string | undefined;
}

/**
 * Circuit breaker health
 */
export interface CircuitBreakerHealth {
    initialized: boolean;
    state: "closed" | "open" | "half-open" | "unknown";
    inMemoryStats?: {
        readonly totalFires: number;
        readonly totalSuccesses: number;
        readonly totalFailures: number;
        readonly totalTimeouts: number;
        readonly totalRejects: number;
        readonly successRate: string;
        readonly lastStateChange: string | null;
    };
    circuitBreakerStats?: Record<string, unknown>;
}

/**
 * Provider service interface
 */
export interface IProviderService {
    initialize(): Promise<void>;
    sendWithFailover(mailOptions: MailOptions, options?: { preferredProvider?: string }): Promise<EmailSendResult>;
    getProviderCount(): number;
    getProviders(): IEmailProvider[];
}

/**
 * Email service interface
 */
export interface IEmailService {
    initialize(): Promise<void>;
    sendEmail(options: SendEmailOptions): Promise<EmailServiceResult>;
    sendVerificationEmail(
        user: { id: string; email: string; name: string },
        token: string,
        locale?: string,
        options?: VerificationEmailOptions
    ): Promise<EmailServiceResult>;
    getCircuitBreakerHealth(): CircuitBreakerHealth;
}
