import { Document, Model } from 'mongoose';

export interface IEmailLog extends Document {
    userId?: string;
    type: 'verification' | 'passwordReset' | 'welcome' | 'notification';
    to: string;
    subject: string;
    messageId?: string;
    status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
    provider: string;
    sentAt?: Date;
    deliveredAt?: Date;
    bouncedAt?: Date;
    failedAt?: Date;
    error?: string;
    bounceType?: 'hard' | 'soft' | 'complaint';
    bounceReason?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEmailLogModel extends Model<IEmailLog> {
    findByUser(userId: string, limit?: number): Promise<IEmailLog[]>;
    findByStatus(status: string, limit?: number): Promise<IEmailLog[]>;
    getStats(userId?: string): Promise<Record<string, number>>;
}
