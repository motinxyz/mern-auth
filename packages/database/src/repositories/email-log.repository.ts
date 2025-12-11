import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/observability";
import type { Model } from "mongoose";
import type { EmailLogDocument, EmailLogModel } from "../models/email-log.model.js";
import type { IEmailLog } from "@auth/contracts";
import { mapEmailLogDocument } from "../mappers.js";

/**
 * EmailLog Repository
 * 
 * Implements IEmailLogRepository contract.
 * Returns IEmailLog POJOs (not Mongoose documents).
 */
class EmailLogRepository extends BaseRepository<EmailLogDocument, IEmailLog> {
  constructor(model: Model<EmailLogDocument>) {
    super(model, "EmailLogRepository");
  }

  /**
   * Map lean document to IEmailLog
   */
  protected mapDocument(doc: unknown): IEmailLog | null {
    return mapEmailLogDocument(doc);
  }

  /**
   * Update email status
   */
  async updateStatus(
    id: string,
    status: string,
    additionalData: Record<string, unknown> = {}
  ): Promise<IEmailLog | null> {
    return withSpan("EmailLogRepository.updateStatus", async () => {
      const update: Record<string, unknown> = { status, ...additionalData };

      // Set timestamp based on status
      if (status === "sent") update.sentAt = new Date();
      if (status === "delivered") update.deliveredAt = new Date();
      if (status === "bounced") update.bouncedAt = new Date();
      if (status === "failed") update.failedAt = new Date();

      const doc = await this.model
        .findByIdAndUpdate(id, update, { new: true })
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Find logs by user
   */
  async findByUser(userId: string, limit = 50): Promise<IEmailLog[]> {
    return withSpan("EmailLogRepository.findByUser", async () => {
      const docs = await (this.model as unknown as EmailLogModel)
        .find({ userId })
        .limit(limit)
        .lean()
        .exec();
      return this.mapDocuments(docs);
    });
  }

  /**
   * Find logs by status
   */
  async findByStatus(status: string, limit = 100): Promise<IEmailLog[]> {
    return withSpan("EmailLogRepository.findByStatus", async () => {
      const docs = await this.model
        .find({ status })
        .limit(limit)
        .lean()
        .exec();
      return this.mapDocuments(docs);
    });
  }

  /**
   * Get email statistics
   */
  async getStats(userId: string | null = null): Promise<Record<string, unknown>> {
    return withSpan("EmailLogRepository.getStats", async () => {
      return (this.model as unknown as EmailLogModel).getStats(userId);
    });
  }

  /**
   * Find by message ID (IEmailLogRepository contract method)
   */
  async findByMessageId(messageId: string): Promise<IEmailLog | null> {
    return withSpan("EmailLogRepository.findByMessageId", async () => {
      const doc = await this.model.findOne({ messageId }).lean().exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Record bounce (IEmailLogRepository contract method)
   */
  async recordBounce(
    messageId: string,
    bounceData: Record<string, unknown>
  ): Promise<IEmailLog | null> {
    return withSpan("EmailLogRepository.recordBounce", async () => {
      const doc = await this.model
        .findOneAndUpdate(
          { messageId },
          {
            status: "bounced",
            bouncedAt: new Date(),
            bounceType: bounceData.type,
            bounceReason: bounceData.reason,
          },
          { new: true }
        )
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Get recent failures
   */
  async getRecentFailures(hours = 24): Promise<IEmailLog[]> {
    return withSpan("EmailLogRepository.getRecentFailures", async () => {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const docs = await this.model
        .find({
          status: { $in: ["failed", "bounced"] },
          createdAt: { $gte: since },
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      return this.mapDocuments(docs);
    });
  }

  /**
   * Protected helper for mapping multiple documents
   */
  protected mapDocuments(docs: unknown[]): IEmailLog[] {
    return docs
      .map(d => this.mapDocument(d))
      .filter((d): d is IEmailLog => d !== null);
  }
}

export default EmailLogRepository;
