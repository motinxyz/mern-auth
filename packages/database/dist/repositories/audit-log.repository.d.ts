import BaseRepository from "./base.repository.js";
import type { ILogger } from "@auth/contracts";
import type { Model } from "mongoose";
import type { AuditLogDocument } from "../models/audit-log.model.js";
interface AuditLogQueryOptions {
    limit?: number;
    skip?: number;
    since?: Date;
}
/**
 * Audit Log Repository
 * Encapsulates all database operations for AuditLog model
 */
declare class AuditLogRepository extends BaseRepository<AuditLogDocument> {
    logger: ILogger;
    constructor(model: Model<AuditLogDocument>, logger: ILogger);
    /**
     * Create audit log entry
     * @param {Object} logData - Audit log data
     */
    create(logData: Partial<AuditLogDocument>): Promise<AuditLogDocument>;
    /**
     * Get audit logs for a user
     * @param {string} userId - User ID
     * @param {AuditLogQueryOptions} options - Query options
     */
    findByUser(userId: string, options?: AuditLogQueryOptions): Promise<(AuditLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get audit logs by action
     * @param {string} action - Action to filter by
     * @param {AuditLogQueryOptions} options - Query options
     */
    findByAction(action: string, options?: AuditLogQueryOptions): Promise<(AuditLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get failed actions for security monitoring
     * @param {AuditLogQueryOptions} options - Query options
     */
    getFailedActions(options?: AuditLogQueryOptions): Promise<(AuditLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
export default AuditLogRepository;
//# sourceMappingURL=audit-log.repository.d.ts.map