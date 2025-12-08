/**
 * @auth/contracts
 *
 * Abstract interfaces for Dependency Injection.
 * Services depend on these contracts, not concrete implementations.
 *
 * This package enables:
 * - Loose coupling between modules
 * - Easy testing with mock implementations
 * - Clean architecture with ports/adapters pattern
 *
 * @packageDocumentation
 */

// =============================================================================
// Common Types (Shared across contracts)
// =============================================================================

export type {
    // Branded ID types for type safety
    UserId,
    EmailLogId,
    AuditLogId,
    // Base health interface
    IHealthResult,
    // Email status types
    EmailStatus,
    BounceType,
    // Email template types
    EmailTemplate,
    // Circuit breaker state
    CircuitBreakerState,
} from "./common.js";

// =============================================================================
// Core Infrastructure
// =============================================================================

export type { ILogger } from "./ILogger.js";
export type { IConfig } from "./IConfig.js";
export type { IRedisConnection } from "./IRedisConnection.js";
export type { ICacheService } from "./ICacheService.js";

// =============================================================================
// Repository Pattern
// =============================================================================

export type { IRepository, FindOptions, SortDirection } from "./IRepository.js";

export type {
    // Entities
    IUser,
    IEmailLog,
    IAuditLog,
    // Repositories
    IUserRepository,
    IEmailLogRepository,
    IAuditLogRepository,
    // Services
    IDatabaseService,
    // Pagination
    PaginationResult,
} from "./IDatabase.js";

// =============================================================================
// Email Services
// =============================================================================

export type {
    // Provider abstraction
    IEmailProvider,
    MailOptions,
    EmailSendResult,
    BounceData,
    ProviderHealthResult,
} from "./IEmailProvider.js";

export type {
    // Email service
    IEmailService,
    IProviderService,
    EmailServiceOptions,
    SendEmailOptions,
    VerificationEmailOptions,
    EmailServiceResult,
    CircuitBreakerHealth,
} from "./IEmailService.js";

// =============================================================================
// Queue Operations
// =============================================================================

export type {
    IQueueProducer,
    JobOptions,
    BackoffOptions,
    QueueJob,
    QueueHealth,
} from "./IQueueProducer.js";

// =============================================================================
// Token Service
// =============================================================================

export type { ITokenService, TokenUser, TokenPayload } from "./ITokenService.js";

// =============================================================================
// Worker & Background Jobs
// =============================================================================

export type {
    // Core interfaces
    IConsumer,
    IWorkerService,
    IQueueProcessor,
    // Job types
    IJob,
    JobData,
    JobResult,
    // Trace context
    TraceContext,
    // Configuration
    ConsumerOptions,
    WorkerConfig,
    ProcessorConfig,
    WorkerServiceOptions,
    QueueProcessorOptions,
    ProcessorRegistrationConfig,
    // Health & Metrics
    ProcessorHealth,
    WorkerHealth,
    WorkerMetrics,
    // Sentry integration
    ISentry,
} from "./IWorker.js";
