import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/utils";

/**
 * EmailLog Repository
 * Encapsulates all database operations for EmailLog model
 */
class EmailLogRepository extends BaseRepository {
  constructor(model) {
    super(model, "EmailLogRepository");
  }

  /**
   * Update email status
   */
  async updateStatus(id, status, additionalData = {}) {
    return withSpan("EmailLogRepository.updateStatus", async () => {
      const update = { status, ...additionalData };

      // Set timestamp based on status
      if (status === "sent") update.sentAt = new Date();
      if (status === "delivered") update.deliveredAt = new Date();
      if (status === "bounced") update.bouncedAt = new Date();
      if (status === "failed") update.failedAt = new Date();

      return this.model.findByIdAndUpdate(id, update, { new: true });
    });
  }

  /**
   * Find logs by user
   */
  async findByUser(userId, limit = 50) {
    return withSpan("EmailLogRepository.findByUser", async () => {
      return this.model.findByUser(userId, limit);
    });
  }

  /**
   * Find logs by status
   */
  async findByStatus(status, limit = 100) {
    return withSpan("EmailLogRepository.findByStatus", async () => {
      return this.model.findByStatus(status, limit);
    });
  }

  /**
   * Get email statistics
   */
  async getStats(userId = null) {
    return withSpan("EmailLogRepository.getStats", async () => {
      return this.model.getStats(userId);
    });
  }

  /**
   * Find by message ID
   */
  async findByMessageId(messageId) {
    return withSpan("EmailLogRepository.findByMessageId", async () => {
      return this.model.findOne({ messageId });
    });
  }

  /**
   * Record bounce
   */
  async recordBounce(messageId, bounceData) {
    return withSpan("EmailLogRepository.recordBounce", async () => {
      return this.model.findOneAndUpdate(
        { messageId },
        {
          status: "bounced",
          bouncedAt: new Date(),
          bounceType: bounceData.type,
          bounceReason: bounceData.reason,
        },
        { new: true }
      );
    });
  }

  /**
   * Get recent failures
   */
  async getRecentFailures(hours = 24) {
    return withSpan("EmailLogRepository.getRecentFailures", async () => {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      return this.model
        .find({
          status: { $in: ["failed", "bounced"] },
          createdAt: { $gte: since },
        })
        .sort({ createdAt: -1 });
    });
  }
}

export default EmailLogRepository;
