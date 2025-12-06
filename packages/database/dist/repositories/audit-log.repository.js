import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/utils";
/**
 * Audit Log Repository
 * Encapsulates all database operations for AuditLog model
 */
class AuditLogRepository extends BaseRepository {
    logger;
    constructor(model, logger) {
        super(model, "AuditLogRepository");
        this.logger = logger.child({ module: "audit-log-repository" });
    }
    /**
     * Create audit log entry
     * @param {Object} logData - Audit log data
     */
    async create(logData) {
        return withSpan("AuditLogRepository.create", async () => {
            try {
                const result = await this.model.create(logData);
                // Mongoose create returns array if input is array, single doc if object.
                // We assume logData is object here.
                const auditLog = (Array.isArray(result) ? result[0] : result);
                if (this.logger) {
                    this.logger.info({
                        auditLogId: auditLog._id.toString(),
                        userId: logData.userId,
                        action: logData.action,
                    }, "Audit log created");
                }
                return auditLog;
            }
            catch (error) {
                if (this.logger) {
                    this.logger.error({ err: error, logData }, "Failed to create audit log");
                }
                // Don't throw - audit logging should not break the application
                return null;
            }
        });
    }
    /**
     * Get audit logs for a user
     * @param {string} userId - User ID
     * @param {AuditLogQueryOptions} options - Query options
     */
    async findByUser(userId, options = {}) {
        return withSpan("AuditLogRepository.findByUser", async () => {
            const { limit = 50, skip = 0, since = null } = options;
            const query = { userId };
            if (since) {
                query.timestamp = { $gte: since };
            }
            return this.model
                .find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
        });
    }
    /**
     * Get audit logs by action
     * @param {string} action - Action to filter by
     * @param {AuditLogQueryOptions} options - Query options
     */
    async findByAction(action, options = {}) {
        return withSpan("AuditLogRepository.findByAction", async () => {
            const { limit = 100, skip = 0, since = null } = options;
            const query = { action };
            if (since) {
                query.timestamp = { $gte: since };
            }
            return this.model
                .find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .lean();
        });
    }
    /**
     * Get failed actions for security monitoring
     * @param {AuditLogQueryOptions} options - Query options
     */
    async getFailedActions(options = {}) {
        return withSpan("AuditLogRepository.getFailedActions", async () => {
            const { limit = 100, since = new Date(Date.now() - 24 * 60 * 60 * 1000), } = options;
            return this.model
                .find({
                status: "failure",
                timestamp: { $gte: since },
            })
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
        });
    }
}
export default AuditLogRepository;
//# sourceMappingURL=audit-log.repository.js.map