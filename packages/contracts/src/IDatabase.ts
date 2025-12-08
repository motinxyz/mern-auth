/**
 * @auth/contracts - Database Interfaces
 *
 * Entity interfaces and repository contracts for database operations.
 * Follows the Repository Pattern for data access abstraction.
 */

import type { IRepository, FindOptions } from "./IRepository.js";
import type { EmailStatus, BounceType } from "./common.js";

// =============================================================================
// Entity Interfaces
// =============================================================================

/**
 * User document interface.
 * Represents a user in the authentication system.
 */
export interface IUser {
    /** Unique user identifier (MongoDB ObjectId as string) */
    readonly _id: string;
    /** User's display name */
    readonly name: string;
    /** User's email address (unique) */
    readonly email: string;
    /** Hashed password */
    readonly password: string;
    /** Whether the user's email has been verified */
    readonly isVerified: boolean;
    /** User's preferred locale (e.g., 'en', 'es') */
    readonly locale: string;
    /** Account creation timestamp */
    readonly createdAt: Date;
    /** Last update timestamp */
    readonly updatedAt: Date;
    /** Whether the email address is valid (no bounces) */
    readonly emailValid?: boolean | undefined;
    /** Number of email bounces for this user */
    readonly emailBounceCount?: number | undefined;
    /** Timestamp of last email bounce */
    readonly lastEmailBounce?: Date | undefined;
    /** Whether a spam complaint was received */
    readonly emailComplaintReceived?: boolean | undefined;
    /** Timestamp of last spam complaint */
    readonly lastEmailComplaint?: Date | undefined;
}

/**
 * Email log document interface.
 * Tracks sent emails and their delivery status.
 */
export interface IEmailLog {
    /** Unique log identifier */
    readonly _id: string;
    /** ID of the user this email was sent to */
    readonly userId?: string | undefined;
    /** Type of email (e.g., 'verification', 'welcome') */
    readonly type?: string | undefined;
    /** Provider-generated message ID */
    readonly messageId: string;
    /** Recipient email address */
    readonly to: string;
    /** Sender email address */
    readonly from: string;
    /** Email subject line */
    readonly subject: string;
    /** Template used to generate the email */
    readonly template?: string | undefined;
    /** Email provider that sent this email */
    readonly provider?: string | undefined;
    /** Current delivery status */
    readonly status: EmailStatus;
    /** Timestamp when email was sent to provider */
    readonly sentAt?: Date | undefined;
    /** Timestamp when email was delivered */
    readonly deliveredAt?: Date | undefined;
    /** Timestamp when email bounced */
    readonly bouncedAt?: Date | undefined;
    /** Type of bounce (soft = temporary, hard = permanent) */
    readonly bounceType?: BounceType | undefined;
    /** Reason for bounce */
    readonly bounceReason?: string | undefined;
    /** Error message if failed */
    readonly error?: string | undefined;
    /** Additional metadata */
    readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    /** Log creation timestamp */
    readonly createdAt: Date;
    /** Last update timestamp */
    readonly updatedAt: Date;
}

/**
 * Audit log document interface.
 * Tracks security-relevant actions in the system.
 */
export interface IAuditLog {
    /** Unique log identifier */
    readonly _id: string;
    /** ID of the user who performed the action */
    readonly userId?: string | undefined;
    /** Action performed (e.g., 'login', 'password_change') */
    readonly action: string;
    /** Resource type affected (e.g., 'user', 'session') */
    readonly resource: string;
    /** ID of the specific resource affected */
    readonly resourceId?: string | undefined;
    /** IP address of the request */
    readonly ipAddress?: string | undefined;
    /** User agent of the request */
    readonly userAgent?: string | undefined;
    /** Additional metadata */
    readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    /** Whether the action was successful */
    readonly success: boolean;
    /** Error message if action failed */
    readonly errorMessage?: string | undefined;
    /** Log creation timestamp */
    readonly createdAt: Date;
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Pagination result metadata.
 */
export interface PaginationResult {
    /** Total number of items matching the query */
    readonly total: number;
    /** Current page number (1-indexed) */
    readonly page: number;
    /** Total number of pages */
    readonly pages: number;
    /** Items per page */
    readonly limit: number;
}

// =============================================================================
// Repository Interfaces
// =============================================================================

/**
 * User repository interface.
 * Extends base repository with user-specific queries.
 */
export interface IUserRepository extends IRepository<IUser> {
    /**
     * Find a user by email address.
     * @param email - Email address to search for
     * @returns User if found, null otherwise
     */
    findByEmail(email: string): Promise<IUser | null>;

    /**
     * Find users with pagination support.
     * @param filter - Optional query filter
     * @param options - Query options including pagination
     * @returns Paginated result with items and metadata
     */
    findWithPagination(
        filter?: Readonly<Record<string, unknown>>,
        options?: FindOptions & { readonly page?: number; readonly limit?: number }
    ): Promise<{ readonly items: readonly IUser[]; readonly pagination: PaginationResult }>;
}

/**
 * Email log repository interface.
 * Extends base repository with email-specific operations.
 */
export interface IEmailLogRepository extends IRepository<IEmailLog> {
    /**
     * Find an email log by provider message ID.
     * @param messageId - Provider-generated message ID
     * @returns Email log if found, null otherwise
     */
    findByMessageId(messageId: string): Promise<IEmailLog | null>;

    /**
     * Update email delivery status.
     * @param id - Email log ID
     * @param status - New delivery status
     * @param additionalData - Optional additional fields to update (messageId, provider, metadata, etc.)
     * @returns Updated email log or null if not found
     */
    updateStatus(
        id: string,
        status: EmailStatus,
        additionalData?: Readonly<Record<string, unknown>>
    ): Promise<IEmailLog | null>;

    /**
     * Record a bounce event for an email.
     * @param messageId - Provider-generated message ID
     * @param bounceData - Bounce event data (bounceType, bounceReason, bouncedAt)
     * @returns Updated email log or null if not found
     */
    recordBounce(
        messageId: string,
        bounceData: Readonly<Record<string, unknown>>
    ): Promise<IEmailLog | null>;
}

/**
 * Audit log repository interface.
 * Extends base repository with audit-specific queries.
 */
export interface IAuditLogRepository extends IRepository<IAuditLog> {
    /**
     * Find audit logs for a specific user.
     * @param userId - User ID to search for
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of audit logs
     */
    findByUser(userId: string, options?: FindOptions): Promise<readonly IAuditLog[]>;

    /**
     * Find audit logs for a specific action type.
     * @param action - Action type to search for
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of audit logs
     */
    findByAction(action: string, options?: FindOptions): Promise<readonly IAuditLog[]>;

    /**
     * Find all failed actions in the audit log.
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of failed audit entries
     */
    getFailedActions(options?: FindOptions): Promise<readonly IAuditLog[]>;
}

// =============================================================================
// Database Service Interface
// =============================================================================

/**
 * Database service interface.
 * Main entry point for database operations, providing access to repositories.
 */
export interface IDatabaseService {
    /** User repository instance */
    readonly userRepository: IUserRepository;
    /** Email log repository instance */
    readonly emailLogRepository: IEmailLogRepository;
    /** Audit log repository instance */
    readonly auditLogRepository: IAuditLogRepository;

    /**
     * Connect to the database.
     */
    connect(): Promise<void>;

    /**
     * Check database connectivity.
     * @returns true if database is reachable
     */
    ping(): Promise<boolean>;

    /**
     * Get the current connection state.
     * @returns Object with readyState (0-3 for MongoDB)
     */
    getConnectionState(): { readonly readyState: number };

    /**
     * Disconnect from the database.
     */
    disconnect(): Promise<void>;
}
