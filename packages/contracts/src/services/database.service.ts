/**
 * @auth/contracts - Database Service
 *
 * Main entry point for database operations.
 */

import type { IUserRepository } from "../repositories/user.repository.js";
import type { IEmailLogRepository } from "../repositories/email-log.repository.js";
import type { IAuditLogRepository } from "../repositories/audit-log.repository.js";

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
