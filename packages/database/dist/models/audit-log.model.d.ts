import mongoose from "mongoose";
/**
 * Audit Log Model
 * Tracks security-relevant user actions for compliance and security monitoring
 */
export interface AuditLogMetadata {
    [key: string]: unknown;
}
export interface AuditLogDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: string;
    status: "success" | "failure";
    ip: string;
    userAgent?: string;
    metadata?: AuditLogMetadata;
    timestamp: Date;
}
declare const AuditLog: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default AuditLog;
//# sourceMappingURL=audit-log.model.d.ts.map