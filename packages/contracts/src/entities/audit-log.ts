/**
 * @auth/contracts - AuditLog Entity
 *
 * Tracks security-relevant actions in the system.
 */

/**
 * Audit log document interface.
 * Tracks security-relevant actions in the system.
 */
export interface IAuditLog {
    /** Unique log identifier */
    readonly _id: string;
    /** ID of the user who performed the action */
    readonly userId?: string | undefined;
    /** Action performed (e.g., 'login', 'password_change') */
    readonly action: string;
    /** Resource type affected (e.g., 'user', 'session') */
    readonly resource: string;
    /** ID of the specific resource affected */
    readonly resourceId?: string | undefined;
    /** IP address of the request */
    readonly ipAddress?: string | undefined;
    /** User agent of the request */
    readonly userAgent?: string | undefined;
    /** Additional metadata */
    readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    /** Whether the action was successful */
    readonly success: boolean;
    /** Error message if action failed */
    readonly errorMessage?: string | undefined;
    /** Log creation timestamp */
    readonly createdAt: Date;
}
