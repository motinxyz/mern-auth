/**
 * @auth/contracts - EmailLog Repository
 *
 * Email-specific repository operations.
 */

import type { IRepository } from "./repository.interface.js";
import type { IEmailLog } from "../entities/email-log.js";
import type { EmailStatus } from "../common/index.js";

/**
 * Email log repository interface.
 * Extends base repository with email-specific operations.
 */
export interface IEmailLogRepository extends IRepository<IEmailLog> {
    /**
     * Find an email log by provider message ID.
     * @param messageId - Provider-generated message ID
     * @returns Email log if found, null otherwise
     */
    findByMessageId(messageId: string): Promise<IEmailLog | null>;

    /**
     * Update email delivery status.
     * @param id - Email log ID
     * @param status - New delivery status
     * @param additionalData - Optional additional fields to update (messageId, provider, metadata, etc.)
     * @returns Updated email log or null if not found
     */
    updateStatus(
        id: string,
        status: EmailStatus,
        additionalData?: Readonly<Record<string, unknown>>
    ): Promise<IEmailLog | null>;

    /**
     * Record a bounce event for an email.
     * @param messageId - Provider-generated message ID
     * @param bounceData - Bounce event data (bounceType, bounceReason, bouncedAt)
     * @returns Updated email log or null if not found
     */
    recordBounce(
        messageId: string,
        bounceData: Readonly<Record<string, unknown>>
    ): Promise<IEmailLog | null>;
}
