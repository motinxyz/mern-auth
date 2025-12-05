import mongoose, { Model } from "mongoose";
import { IUser } from "./models/user.model";
import { IEmailLog, IEmailLogModel } from "./models/email-log.model";

export declare class DatabaseConnectionManager {
    constructor(options: { config: any; logger?: any; t?: Function });
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): { isConnected: boolean; readyState: number; readyStateLabel: string };
    healthCheck(): Promise<{ healthy: boolean; reason?: string }>;
}

export declare class UserRepository {
    constructor(model: Model<IUser>);
    findByEmail(email: string): Promise<IUser | null>;
    findByNormalizedEmail(normalizedEmail: string): Promise<IUser | null>;
    findById(id: string): Promise<IUser | null>;
    create(userData: Partial<IUser>): Promise<IUser>;
    update(id: string, updates: Partial<IUser>): Promise<IUser | null>;
    delete(id: string): Promise<IUser | null>;
    markEmailBounced(userId: string, reason: string): Promise<IUser | null>;
    markEmailComplaint(userId: string): Promise<IUser | null>;
    verifyEmail(userId: string): Promise<IUser | null>;
    findWithPagination(filter?: any, options?: any): Promise<{ users: IUser[]; pagination: any }>;
}

export declare class EmailLogRepository {
    constructor(model: IEmailLogModel);
    create(logData: Partial<IEmailLog>): Promise<IEmailLog>;
    updateStatus(id: string, status: string, additionalData?: any): Promise<IEmailLog | null>;
    findByUser(userId: string, limit?: number): Promise<IEmailLog[]>;
    findByStatus(status: string, limit?: number): Promise<IEmailLog[]>;
    getStats(userId?: string): Promise<Record<string, number>>;
    findByMessageId(messageId: string): Promise<IEmailLog | null>;
    recordBounce(messageId: string, bounceData: any): Promise<IEmailLog | null>;
    getRecentFailures(hours?: number): Promise<IEmailLog[]>;
}

export default class DatabaseService {
    constructor(options: { config: any; logger?: any; t?: Function });
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): { isConnected: boolean; readyState: number; readyStateLabel: string };
    healthCheck(): Promise<{ healthy: boolean; reason?: string }>;

    readonly users: UserRepository;
    readonly emailLogs: EmailLogRepository;
    readonly mongoose: typeof mongoose;
    readonly models: {
        User: Model<IUser>;
        EmailLog: IEmailLogModel;
    };
}

// Re-export for convenience
export { DatabaseConnectionManager, UserRepository, EmailLogRepository };
export { IUser, IEmailLog };
