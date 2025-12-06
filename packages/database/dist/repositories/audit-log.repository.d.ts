import BaseRepository from "./base.repository.js";
/**
 * Audit Log Repository
 * Encapsulates all database operations for AuditLog model
 */
declare class AuditLogRepository extends BaseRepository {
    logger: any;
    constructor(model: any, logger: any);
    /**
     * Create audit log entry
     * @param {Object} logData - Audit log data
     */
    create(logData: any): Promise<any>;
    /**
     * Get audit logs for a user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     */
    findByUser(userId: string, options?: any): Promise<any>;
    /**
     * Get audit logs by action
     * @param {string} action - Action to filter by
     * @param {Object} options - Query options
     */
    findByAction(action: string, options?: any): Promise<any>;
    /**
     * Get failed actions for security monitoring
     * @param {Object} options - Query options
     */
    getFailedActions(options?: any): Promise<any>;
}
export default AuditLogRepository;
//# sourceMappingURL=audit-log.repository.d.ts.map