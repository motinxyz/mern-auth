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

const emailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["verification", "passwordReset", "welcome", "notification"],
      required: true,
    },
    to: {
      type: String,
      required: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      index: true,
      sparse: true, // Allow null values, only index non-null
    },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "bounced", "failed"],
      default: "queued",
    },
    provider: {
      type: String,
      default: "primary",
    },
    sentAt: Date,
    deliveredAt: Date,
    bouncedAt: Date,
    failedAt: Date,
    error: String,
    bounceType: {
      type: String,
      enum: ["hard", "soft", "complaint"],
    },
    bounceReason: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
// Support: findByStatus(status).sort(-createdAt) -> Used by getRecentFailures
emailLogSchema.index({ status: 1, createdAt: -1 });

// Support: findByUser(userId).sort(-createdAt) -> Main dashboard history view
emailLogSchema.index({ userId: 1, createdAt: -1 });

// TTL index - automatically delete logs older than 30 days
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Static methods
emailLogSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

emailLogSchema.statics.findByStatus = function (status, limit = 100) {
  return this.find({ status }).sort({ createdAt: -1 }).limit(limit);
};

emailLogSchema.statics.getStats = async function (userId: string | null) {
  const stats = (await this.aggregate([
    ...(userId !== null
      ? [{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]
      : []),
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ])) as Array<{ _id: string; count: number }>;

  return stats.reduce((acc: Record<string, number>, { _id, count }) => {
    // eslint-disable-next-line security/detect-object-injection
    if (_id !== null && _id !== undefined) acc[_id] = count;
    return acc;
  }, {});
};

const EmailLog =
  mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
