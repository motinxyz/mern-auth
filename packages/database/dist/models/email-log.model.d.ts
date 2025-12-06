import mongoose from "mongoose";
/**
 * EmailLog model for tracking all email sends
 * Tracks delivery status, bounces, and provides audit trail
 */
export interface EmailLogMetadata {
    [key: string]: unknown;
}
export interface EmailLogDocument extends mongoose.Document {
    userId?: mongoose.Types.ObjectId;
    type: "verification" | "passwordReset" | "welcome" | "notification";
    to: string;
    subject: string;
    messageId?: string;
    status: "queued" | "sent" | "delivered" | "bounced" | "failed";
    provider: string;
    sentAt?: Date;
    deliveredAt?: Date;
    bouncedAt?: Date;
    failedAt?: Date;
    error?: string;
    bounceType?: "hard" | "soft" | "complaint";
    bounceReason?: string;
    metadata?: EmailLogMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export interface EmailLogModel extends mongoose.Model<EmailLogDocument> {
    findByUser(userId: string, limit?: number): Promise<EmailLogDocument[]>;
    findByStatus(status: string, limit?: number): Promise<EmailLogDocument[]>;
    getStats(userId: string | null): Promise<Record<string, number>>;
}
declare const EmailLog: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default EmailLog;
//# sourceMappingURL=email-log.model.d.ts.map