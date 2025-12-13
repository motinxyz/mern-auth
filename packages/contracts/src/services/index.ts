/**
 * @auth/contracts - Services Barrel Export
 *
 * Re-exports all service interfaces.
 */

// Database
export type { IDatabaseService } from "./database.service.js";

// Cache
export type { ICacheService } from "./cache.service.js";

// Token
export type { ITokenService, TokenUser, TokenPayload } from "./token.service.js";

// Email templates
export type { EmailTemplate } from "./email-templates.js";

// Email provider
export type {
    IEmailProvider,
    MailOptions,
    EmailSendResult,
    BounceData,
    ProviderHealthResult,
} from "./email-provider.interface.js";

// Email service
export type {
    IEmailService,
    IProviderService,
    EmailServiceOptions,
    SendEmailOptions,
    VerificationEmailOptions,
    EmailServiceResult,
    CircuitBreakerHealth,
} from "../email/index.js";

// Queue
export type {
    IQueueProducer,
    JobOptions,
    BackoffOptions,
    QueueJob,
    QueueHealth,
} from "./queue.service.js";
