import BaseRepository from "./base.repository.js";
import type { Model } from "mongoose";
import type { EmailLogDocument } from "../models/email-log.model.js";
/**
 * EmailLog Repository
 * Encapsulates all database operations for EmailLog model
 */
declare class EmailLogRepository extends BaseRepository<EmailLogDocument> {
    constructor(model: Model<EmailLogDocument>);
    /**
     * Update email status
     */
    updateStatus(id: string, status: string, additionalData?: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, EmailLogDocument, {}, import("mongoose").DefaultSchemaOptions> & EmailLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Find logs by user
     */
    findByUser(userId: string, limit?: number): Promise<EmailLogDocument[]>;
    /**
     * Find logs by status
     */
    findByStatus(status: string, limit?: number): Promise<EmailLogDocument[]>;
    /**
     * Get email statistics
     */
    getStats(userId?: string | null): Promise<Record<string, number>>;
    /**
     * Find by message ID
     */
    findByMessageId(messageId: string): Promise<import("mongoose").Document<unknown, {}, EmailLogDocument, {}, import("mongoose").DefaultSchemaOptions> & EmailLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Record bounce
     */
    recordBounce(messageId: string, bounceData: {
        type: string;
        reason: string;
    }): Promise<import("mongoose").Document<unknown, {}, EmailLogDocument, {}, import("mongoose").DefaultSchemaOptions> & EmailLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get recent failures
     */
    getRecentFailures(hours?: number): Promise<(import("mongoose").Document<unknown, {}, EmailLogDocument, {}, import("mongoose").DefaultSchemaOptions> & EmailLogDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
export default EmailLogRepository;
//# sourceMappingURL=email-log.repository.d.ts.map