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
    emailLogRepository?: IEmailLogRepository;
    providerService?: IProviderService;
}
/**
 * Email send options
 */
export interface SendEmailOptions {
    to: string;
    template: string;
    data: Record<string, unknown>;
    locale?: string;
    preferredProvider?: string;
}
/**
 * Circuit breaker health
 */
export interface CircuitBreakerHealth {
    state: "closed" | "open" | "half-open";
    failures: number;
    successes: number;
    lastFailure?: Date;
}
/**
 * Provider service interface
 */
export interface IProviderService {
    initialize(): Promise<void>;
    sendWithFailover(mailOptions: MailOptions, options?: {
        preferredProvider?: string;
    }): Promise<EmailSendResult>;
    getProviderCount(): number;
    getProviders(): IEmailProvider[];
}
/**
 * Email service interface
 */
export interface IEmailService {
    initialize(): Promise<void>;
    sendEmail(options: any): Promise<EmailSendResult>;
    sendVerificationEmail(user: {
        id: string;
        email: string;
        name: string;
    }, token: string, locale?: string, options?: {
        preferredProvider?: string;
    }): Promise<EmailSendResult>;
    getCircuitBreakerHealth(): CircuitBreakerHealth;
}
//# sourceMappingURL=IEmailService.d.ts.map