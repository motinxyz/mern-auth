import type { IRepository, FindOptions } from "./IRepository.js";
/**
 * User document interface
 */
export interface IUser {
    _id: string;
    id?: string;
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
    emailValid?: boolean;
    emailBounceCount?: number;
    lastEmailBounce?: Date;
    emailComplaintReceived?: boolean;
    lastEmailComplaint?: Date;
}
/**
 * Email log document interface
 */
export interface IEmailLog {
    _id: string;
    messageId: string;
    to: string;
    from: string;
    subject: string;
    template?: string;
    provider?: string;
    status: "pending" | "sent" | "delivered" | "bounced" | "failed";
    sentAt?: Date;
    deliveredAt?: Date;
    bouncedAt?: Date;
    bounceType?: "soft" | "hard";
    bounceReason?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Audit log document interface
 */
export interface IAuditLog {
    _id: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    errorMessage?: string;
    createdAt: Date;
}
/**
 * User repository interface
 */
export interface IUserRepository extends IRepository<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findWithPagination(filter?: Record<string, unknown>, options?: FindOptions & {
        page?: number;
        limit?: number;
    }): Promise<{
        items: IUser[];
        pagination: PaginationResult;
    }>;
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
    total: number;
    page: number;
    pages: number;
    limit: number;
}
/**
 * Database service interface
 */
export interface IDatabaseService {
    userRepository: IUserRepository;
    emailLogRepository: IEmailLogRepository;
    auditLogRepository: IAuditLogRepository;
    ping(): Promise<boolean>;
    getConnectionState(): {
        readyState: number;
    };
    disconnect(): Promise<void>;
}
//# sourceMappingURL=IDatabase.d.ts.map