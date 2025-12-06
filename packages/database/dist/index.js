import mongoose from "mongoose";
import { ConfigurationError } from "@auth/utils";
import DatabaseConnectionManager from "./connection-manager.js";
import UserRepository from "./repositories/user.repository.js";
import EmailLogRepository from "./repositories/email-log.repository.js";
import AuditLogRepository from "./repositories/audit-log.repository.js";
import User from "./models/user.model.js";
import EmailLog from "./models/email-log.model.js";
import AuditLog from "./models/audit-log.model.js";
import { DB_ERRORS } from "./constants/database.messages.js";
/**
 * Database Service
 * Production-grade database layer with DI
 */
class DatabaseService {
    connectionManager;
    userRepository;
    emailLogRepository;
    auditLogRepository;
    constructor(options = {}) {
        if (!options.config) {
            throw new ConfigurationError(DB_ERRORS.MISSING_CONFIG.replace("{option}", "config"));
        }
        this.connectionManager = new DatabaseConnectionManager(options);
        // Initialize repositories
        this.userRepository = new UserRepository(User);
        this.emailLogRepository = new EmailLogRepository(EmailLog);
        this.auditLogRepository = new AuditLogRepository(AuditLog, options.logger);
    }
    /**
     * Connect to database
     */
    async connect() {
        return this.connectionManager.connect();
    }
    /**
     * Disconnect from database
     */
    async disconnect() {
        return this.connectionManager.disconnect();
    }
    /**
     * Get connection state
     */
    getConnectionState() {
        return this.connectionManager.getConnectionState();
    }
    /**
     * Health check
     */
    async healthCheck() {
        return this.connectionManager.healthCheck();
    }
    /**
     * Simple ping check
     */
    async ping() {
        return this.connectionManager.ping();
    }
    /**
     * Get user repository
     */
    get users() {
        return this.userRepository;
    }
    /**
     * Get email log repository
     */
    get emailLogs() {
        return this.emailLogRepository;
    }
    /**
     * Get audit log repository
     */
    get auditLogs() {
        return this.auditLogRepository;
    }
}
// Export DatabaseService as default
export default DatabaseService;
// Also export models and mongoose for testing and migrations
export { User, EmailLog, AuditLog, mongoose };
export { UserRepository, EmailLogRepository, AuditLogRepository, DatabaseConnectionManager, };
//# sourceMappingURL=index.js.map