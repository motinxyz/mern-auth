/**
 * @auth/contracts - AuditLog Repository
 *
 * Audit-specific repository operations.
 */

import type { IRepository, FindOptions } from "./repository.interface.js";
import type { IAuditLog } from "../entities/audit-log.js";

/**
 * Audit log repository interface.
 * Extends base repository with audit-specific queries.
 */
export interface IAuditLogRepository extends IRepository<IAuditLog> {
    /**
     * Find audit logs for a specific user.
     * @param userId - User ID to search for
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of audit logs
     */
    findByUser(userId: string, options?: FindOptions): Promise<readonly IAuditLog[]>;

    /**
     * Find audit logs for a specific action type.
     * @param action - Action type to search for
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of audit logs
     */
    findByAction(action: string, options?: FindOptions): Promise<readonly IAuditLog[]>;

    /**
     * Find all failed actions in the audit log.
     * @param options - Query options (limit, sort, etc.)
     * @returns Array of failed audit entries
     */
    getFailedActions(options?: FindOptions): Promise<readonly IAuditLog[]>;
}
