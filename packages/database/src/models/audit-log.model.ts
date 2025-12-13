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

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'user.registered', 'user.verified', 'user.login', 'user.logout'
    },
    resource: {
      type: String,
      required: true,
      // Examples: 'User', 'EmailLog', 'Session'
    },
    resourceId: {
      type: String,
      // ID of the affected resource
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed as unknown as AuditLogMetadata,
      // Additional context-specific data
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // Note: Indexed via compound indexes and TTL index below
    },
  },
  {
    timestamps: false, // We're using custom timestamp field
  }
);

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
// This also serves as the time-based query index
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
