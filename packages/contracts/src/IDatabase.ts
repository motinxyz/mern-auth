/**
 * @auth/contracts - Database Interfaces
 *
 * Entity and repository interfaces for database operations.
 */

import type { IRepository, FindOptions } from "./IRepository.js";

/**
 * User document interface
 */
export interface IUser {
    readonly _id: string;
    readonly name: string;
    readonly email: string;
    readonly password: string;
    readonly isVerified: boolean;
    readonly locale: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly emailValid?: boolean;
    readonly emailBounceCount?: number;
    readonly lastEmailBounce?: Date;
    readonly emailComplaintReceived?: boolean;
    readonly lastEmailComplaint?: Date;
}

/**
 * Email log document interface
 */
export interface IEmailLog {
    readonly _id: string;
    readonly userId?: string | undefined;
    readonly type?: string | undefined;
    readonly messageId: string;
    readonly to: string;
    readonly from: string;
    readonly subject: string;
    readonly template?: string | undefined;
    readonly provider?: string | undefined;
    readonly status: "queued" | "pending" | "sent" | "delivered" | "bounced" | "failed";
    readonly sentAt?: Date | undefined;
    readonly deliveredAt?: Date | undefined;
    readonly bouncedAt?: Date | undefined;
    readonly bounceType?: "soft" | "hard" | undefined;
    readonly bounceReason?: string | undefined;
    readonly error?: string | undefined;
    readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * Audit log document interface
 */
export interface IAuditLog {
    readonly _id: string;
    readonly userId?: string;
    readonly action: string;
    readonly resource: string;
    readonly resourceId?: string;
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly success: boolean;
    readonly errorMessage?: string;
    readonly createdAt: Date;
}

/**
 * User repository interface
 */
export interface IUserRepository extends IRepository<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findWithPagination(
        filter?: Record<string, unknown>,
        options?: FindOptions & { page?: number; limit?: number }
    ): Promise<{ items: IUser[]; pagination: PaginationResult }>;
}

/**
 * Email log repository interface
 */
export interface IEmailLogRepository extends IRepository<IEmailLog> {
    findByMessageId(messageId: string): Promise<IEmailLog | null>;
    updateStatus(id: string, status: string, additionalData?: Record<string, unknown>): Promise<IEmailLog | null>;
    recordBounce(messageId: string, bounceData: Record<string, unknown>): Promise<IEmailLog | null>;
}

/**
 * Audit log repository interface
 */
export interface IAuditLogRepository extends IRepository<IAuditLog> {
    findByUser(userId: string, options?: FindOptions): Promise<IAuditLog[]>;
    findByAction(action: string, options?: FindOptions): Promise<IAuditLog[]>;
    getFailedActions(options?: FindOptions): Promise<IAuditLog[]>;
}

/**
 * Pagination result
 */
export interface PaginationResult {
    readonly total: number;
    readonly page: number;
    readonly pages: number;
    readonly limit: number;
}

/**
 * Database service interface
 */
export interface IDatabaseService {
    readonly userRepository: IUserRepository;
    readonly emailLogRepository: IEmailLogRepository;
    readonly auditLogRepository: IAuditLogRepository;

    connect(): Promise<void>;
    ping(): Promise<boolean>;
    getConnectionState(): { readyState: number };
    disconnect(): Promise<void>;
}
