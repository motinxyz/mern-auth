import mongoose from "mongoose";
import { ConfigurationError } from "@auth/utils";
import type { ILogger, IConfig } from "@auth/contracts";
import DatabaseConnectionManager from "./connection-manager.js";
import UserRepository from "./repositories/user.repository.js";
import EmailLogRepository from "./repositories/email-log.repository.js";
import AuditLogRepository from "./repositories/audit-log.repository.js";
import User from "./models/user.model.js";
import EmailLog from "./models/email-log.model.js";
import type { EmailLogModel } from "./models/email-log.model.js";
import AuditLog from "./models/audit-log.model.js";
import type { AuditLogDocument } from "./models/audit-log.model.js";
import { DB_ERRORS } from "./constants/database.messages.js";
import type { UserDocument } from "./models/user.model.js";

/**
 * Database Service
 * Production-grade database layer with DI
 */
class DatabaseService {
  public connectionManager: DatabaseConnectionManager;
  public userRepository: UserRepository;
  public emailLogRepository: EmailLogRepository;
  public auditLogRepository: AuditLogRepository;

  constructor(options: {
    config: IConfig;
    logger: ILogger;
    t?: (key: string, params?: Record<string, unknown>) => string;
  }) {
    if (options.config === undefined || options.config === null) {
      throw new ConfigurationError(
        DB_ERRORS.MISSING_CONFIG.replace("{option}", "config")
      );
    }

    this.connectionManager = new DatabaseConnectionManager(options);

    // Initialize repositories
    this.userRepository = new UserRepository(User as unknown as mongoose.Model<UserDocument>);
    this.emailLogRepository = new EmailLogRepository(EmailLog as unknown as EmailLogModel);
    this.auditLogRepository = new AuditLogRepository(AuditLog as unknown as mongoose.Model<AuditLogDocument>, options.logger);
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
export {
  UserRepository,
  EmailLogRepository,
  AuditLogRepository,
  DatabaseConnectionManager,
};

export type { UserDocument } from "./models/user.model.js";
export type { EmailLogDocument } from "./models/email-log.model.js";
export type { AuditLogDocument } from "./models/audit-log.model.js";
