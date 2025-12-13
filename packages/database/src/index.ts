import mongoose from "mongoose";
import { ConfigurationError } from "@auth/utils";
import type {
  ILogger,
  IConfig,
  IDatabaseService,
  IUserRepository,
  IEmailLogRepository,
  IAuditLogRepository,
} from "@auth/contracts";
import DatabaseConnectionManager from "./connection-manager.js";
import UserRepository from "./repositories/user.repository.js";
import EmailLogRepository from "./repositories/email-log.repository.js";
import AuditLogRepository from "./repositories/audit-log.repository.js";
import User from "./models/user.model.js";
import EmailLog from "./models/email-log.model.js";
import AuditLog from "./models/audit-log.model.js";
import type { AuditLogDocument } from "./models/audit-log.model.js";
import { DB_ERRORS } from "./constants/database.messages.js";
import type { UserDocument } from "./models/user.model.js";
import type { EmailLogDocument } from "./models/email-log.model.js";

/**
 * Database Service
 * 
 * Production-grade database layer implementing IDatabaseService contract.
 * Returns contract-compliant POJOs via repository mappers.
 */
class DatabaseService implements IDatabaseService {
  private readonly connectionManager: DatabaseConnectionManager;
  private readonly _userRepository: UserRepository;
  private readonly _emailLogRepository: EmailLogRepository;
  private readonly _auditLogRepository: AuditLogRepository;

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

    // Initialize repositories with models
    this._userRepository = new UserRepository(
      User as mongoose.Model<UserDocument>
    );
    this._emailLogRepository = new EmailLogRepository(
      EmailLog as mongoose.Model<EmailLogDocument>
    );
    this._auditLogRepository = new AuditLogRepository(
      AuditLog as mongoose.Model<AuditLogDocument>,
      options.logger
    );
  }

  /**
   * IDatabaseService contract: userRepository getter
   */
  get userRepository(): IUserRepository {
    return this._userRepository;
  }

  /**
   * IDatabaseService contract: emailLogRepository getter
   */
  get emailLogRepository(): IEmailLogRepository {
    return this._emailLogRepository;
  }

  /**
   * IDatabaseService contract: auditLogRepository getter
   */
  get auditLogRepository(): IAuditLogRepository {
    return this._auditLogRepository;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.connectionManager.connect();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.connectionManager.disconnect();
  }

  /**
   * Get connection state (IDatabaseService contract)
   */
  getConnectionState(): { readyState: number } {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs?: number; reason?: string }> {
    return this.connectionManager.healthCheck();
  }

  /**
   * Simple ping check (IDatabaseService contract)
   */
  async ping(): Promise<boolean> {
    return this.connectionManager.ping();
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
