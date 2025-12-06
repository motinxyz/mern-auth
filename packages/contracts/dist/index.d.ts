/**
 * @auth/contracts
 *
 * Abstract interfaces for Dependency Injection.
 * Services depend on these contracts, not concrete implementations.
 */
export type { ILogger } from "./ILogger.js";
export type { IConfig } from "./IConfig.js";
export type { IRedisConnection } from "./IRedisConnection.js";
export type { ICacheService } from "./ICacheService.js";
export type { IRepository, FindOptions } from "./IRepository.js";
export type { IUser, IEmailLog, IAuditLog, IUserRepository, IEmailLogRepository, IAuditLogRepository, IDatabaseService, PaginationResult, } from "./IDatabase.js";
export type { IEmailProvider, MailOptions, EmailSendResult, BounceData, ProviderHealthResult, } from "./IEmailProvider.js";
export type { IEmailService, IProviderService, EmailServiceOptions, SendEmailOptions, CircuitBreakerHealth, } from "./IEmailService.js";
export type { IQueueProducer, JobOptions, QueueJob, QueueHealth, } from "./IQueueProducer.js";
export type { ITokenService, TokenUser, TokenPayload, } from "./ITokenService.js";
export type { IConsumer, IWorkerService, IQueueProcessor, IJob, JobData, JobResult, ConsumerOptions, ProcessorConfig, } from "./IWorker.js";
//# sourceMappingURL=index.d.ts.map