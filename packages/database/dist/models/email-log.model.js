import mongoose from "mongoose";
/**
 * EmailLog model for tracking all email sends
 * Tracks delivery status, bounces, and provides audit trail
 */
const emailLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    type: {
        type: String,
        enum: ["verification", "passwordReset", "welcome", "notification"],
        required: true,
        index: true,
    },
    to: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
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
        index: true,
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
}, {
    timestamps: true,
});
// Compound indexes for common queries
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ userId: 1, type: 1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ to: 1, createdAt: -1 });
// TTL index - automatically delete logs older than 30 days
// This prevents unbounded database growth while keeping recent logs for debugging
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
// Static methods
emailLogSchema.statics.findByUser = function (userId, limit = 50) {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};
emailLogSchema.statics.findByStatus = function (status, limit = 100) {
    return this.find({ status }).sort({ createdAt: -1 }).limit(limit);
};
emailLogSchema.statics.getStats = async function (userId) {
    const stats = await this.aggregate([
        ...(userId
            ? [{ $match: { userId: new mongoose.Types.ObjectId(userId) } }]
            : []),
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
    return stats.reduce((acc, { _id, count }) => {
        // eslint-disable-next-line security/detect-object-injection
        if (_id)
            acc[_id] = count;
        return acc;
    }, {});
};
const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
//# sourceMappingURL=email-log.model.js.map