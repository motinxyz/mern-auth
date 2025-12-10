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
    UserId,
    EmailLogId,
    AuditLogId,
    IHealthResult,
    EmailStatus,
    BounceType,
    CircuitBreakerState,
} from "./common/index.js";

// =============================================================================
// Core Infrastructure
// =============================================================================

export type {
    ILogger,
    IConfig,
    IRedisConnection,
} from "./core/index.js";

// =============================================================================
// Entities (Domain Models)
// =============================================================================

export type {
    IUser,
    IEmailLog,
    IAuditLog,
} from "./entities/index.js";

// =============================================================================
// Repository Pattern
// =============================================================================

export type {
    IRepository,
    FindOptions,
    SortDirection,
    IUserRepository,
    PaginationResult,
    IEmailLogRepository,
    IAuditLogRepository,
} from "./repositories/index.js";

// =============================================================================
// Services
// =============================================================================

export type {
    // Database
    IDatabaseService,
    // Cache
    ICacheService,
    // Token
    ITokenService,
    TokenUser,
    TokenPayload,
    // Email templates
    EmailTemplate,
    // Email provider
    IEmailProvider,
    MailOptions,
    EmailSendResult,
    BounceData,
    ProviderHealthResult,
    // Email service
    IEmailService,
    IProviderService,
    EmailServiceOptions,
    SendEmailOptions,
    VerificationEmailOptions,
    EmailServiceResult,
    CircuitBreakerHealth,
    // Queue
    IQueueProducer,
    JobOptions,
    BackoffOptions,
    QueueJob,
    QueueHealth,
} from "./services/index.js";

// =============================================================================
// Worker & Background Jobs
// =============================================================================

export type {
    ISentry,
    IConsumer,
    ConsumerOptions,
    JobData,
    TraceContext,
    IJob,
    JobResult,
    IQueueProcessor,
    ProcessorConfig,
    ProcessorHealth,
    QueueProcessorOptions,
    ProcessorRegistrationConfig,
    WorkerConfig,
    WorkerMetrics,
    IWorkerService,
    WorkerServiceOptions,
    WorkerHealth,
} from "./worker/index.js";

// =============================================================================
// HTTP Types (Shared with Frontend)
// =============================================================================

export {
    HTTP_STATUS_CODES,
    isHttpStatusCode,
} from "./http/index.js";

export type {
    HttpStatusCode,
    IApiResponse,
    IApiError,
    IValidationErrorDetail,
    ApiResponseType,
} from "./http/index.js";
