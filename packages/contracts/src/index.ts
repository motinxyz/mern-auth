/**
 * @auth/contracts
 *
 * Abstract interfaces for Dependency Injection.
 * Services depend on these contracts, not concrete implementations.
 */

export type { ICacheService } from "./ICacheService.js";
export type {
    IEmailProvider,
    MailOptions,
    EmailSendResult,
    BounceData,
    ProviderHealthResult,
} from "./IEmailProvider.js";
export type {
    IQueueProducer,
    JobOptions,
    QueueJob,
    QueueHealth,
} from "./IQueueProducer.js";
export type {
    ITokenService,
    TokenUser,
    TokenPayload,
} from "./ITokenService.js";
