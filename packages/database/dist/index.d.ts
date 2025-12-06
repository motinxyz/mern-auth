import mongoose from "mongoose";
import type { ILogger, IConfig } from "@auth/contracts";
import DatabaseConnectionManager from "./connection-manager.js";
import UserRepository from "./repositories/user.repository.js";
import EmailLogRepository from "./repositories/email-log.repository.js";
import AuditLogRepository from "./repositories/audit-log.repository.js";
import User from "./models/user.model.js";
import EmailLog from "./models/email-log.model.js";
import AuditLog from "./models/audit-log.model.js";
/**
 * Database Service
 * Production-grade database layer with DI
 */
declare class DatabaseService {
    connectionManager: DatabaseConnectionManager;
    userRepository: UserRepository;
    emailLogRepository: EmailLogRepository;
    auditLogRepository: AuditLogRepository;
    constructor(options: {
        config: IConfig;
        logger: ILogger;
        t?: (key: string, params?: unknown) => string;
    });
    /**
     * Connect to database
     */
    connect(): Promise<void>;
    /**
     * Disconnect from database
     */
    disconnect(): Promise<void>;
    /**
     * Get connection state
     */
    getConnectionState(): {
        isConnected: boolean;
        readyState: mongoose.ConnectionStates;
        readyStateLabel: any;
    };
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        reason?: undefined;
    } | {
        healthy: boolean;
        reason: any;
    }>;
    /**
     * Simple ping check
     */
    ping(): Promise<boolean>;
    /**
     * Get user repository
     */
    get users(): UserRepository;
    /**
     * Get email log repository
     */
    get emailLogs(): EmailLogRepository;
    /**
     * Get audit log repository
     */
    get auditLogs(): AuditLogRepository;
}
export default DatabaseService;
export { User, EmailLog, AuditLog, mongoose };
export { UserRepository, EmailLogRepository, AuditLogRepository, DatabaseConnectionManager, };
export type { UserDocument } from "./models/user.model.js";
export type { EmailLogDocument } from "./models/email-log.model.js";
export type { AuditLogDocument } from "./models/audit-log.model.js";
//# sourceMappingURL=index.d.ts.map