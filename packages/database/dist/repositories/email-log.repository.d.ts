import BaseRepository from "./base.repository.js";
/**
 * EmailLog Repository
 * Encapsulates all database operations for EmailLog model
 */
declare class EmailLogRepository extends BaseRepository {
    constructor(model: any);
    /**
     * Update email status
     */
    updateStatus(id: string, status: string, additionalData?: any): Promise<any>;
    /**
     * Find logs by user
     */
    findByUser(userId: any, limit?: number): Promise<any>;
    /**
     * Find logs by status
     */
    findByStatus(status: any, limit?: number): Promise<any>;
    /**
     * Get email statistics
     */
    getStats(userId?: any): Promise<any>;
    /**
     * Find by message ID
     */
    findByMessageId(messageId: any): Promise<any>;
    /**
     * Record bounce
     */
    recordBounce(messageId: any, bounceData: any): Promise<any>;
    /**
     * Get recent failures
     */
    getRecentFailures(hours?: number): Promise<any>;
}
export default EmailLogRepository;
//# sourceMappingURL=email-log.repository.d.ts.map