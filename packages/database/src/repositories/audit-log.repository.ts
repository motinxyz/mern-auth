import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/observability";
import type { ILogger, IAuditLog, FindOptions } from "@auth/contracts";
import type { Model } from "mongoose";
import type { AuditLogDocument } from "../models/audit-log.model.js";
import { mapAuditLogDocument } from "../mappers.js";

interface AuditLogQueryOptions extends FindOptions {
  since?: Date;
}

/**
 * Audit Log Repository
 * 
 * Implements IAuditLogRepository contract.
 * Returns IAuditLog POJOs (not Mongoose documents).
 */
class AuditLogRepository extends BaseRepository<AuditLogDocument, IAuditLog> {
  public logger: ILogger;

  constructor(model: Model<AuditLogDocument>, logger: ILogger) {
    super(model, "AuditLogRepository");
    this.logger = logger.child({ module: "audit-log-repository" });
  }

  /**
   * Map lean document to IAuditLog
   */
  protected mapDocument(doc: unknown): IAuditLog | null {
    return mapAuditLogDocument(doc);
  }

  /**
   * Create audit log entry (override to add logging)
   */
  async create(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    return withSpan("AuditLogRepository.create", async () => {
      const doc = new this.model(logData);
      const saved = await doc.save();
      const lean = saved.toObject();
      const mapped = this.mapDocument(lean);

      if (mapped === null || mapped === undefined) {
        throw new Error("Failed to map created audit log");
      }

      this.logger.info(
        {
          auditLogId: mapped._id,
          userId: logData.userId,
          action: logData.action,
        },
        "Audit log created"
      );

      return mapped;
    });
  }

  /**
   * Get audit logs for a user (IAuditLogRepository contract method)
   */
  async findByUser(userId: string, options: AuditLogQueryOptions = {}): Promise<IAuditLog[]> {
    return withSpan("AuditLogRepository.findByUser", async () => {
      const { limit = 50, skip = 0, since } = options;

      const query: Record<string, unknown> = { userId };
      if (since) {
        query.timestamp = { $gte: since };
      }

      const docs = await this.model
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec();

      return this.mapDocuments(docs);
    });
  }

  /**
   * Get audit logs by action (IAuditLogRepository contract method)
   */
  async findByAction(action: string, options: AuditLogQueryOptions = {}): Promise<IAuditLog[]> {
    return withSpan("AuditLogRepository.findByAction", async () => {
      const { limit = 100, skip = 0, since } = options;

      const query: Record<string, unknown> = { action };
      if (since) {
        query.timestamp = { $gte: since };
      }

      const docs = await this.model
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec();

      return this.mapDocuments(docs);
    });
  }

  /**
   * Get failed actions for security monitoring (IAuditLogRepository contract method)
   */
  async getFailedActions(options: AuditLogQueryOptions = {}): Promise<IAuditLog[]> {
    return withSpan("AuditLogRepository.getFailedActions", async () => {
      const {
        limit = 100,
        since = new Date(Date.now() - 24 * 60 * 60 * 1000),
      } = options;

      const docs = await this.model
        .find({
          status: "failure",
          timestamp: { $gte: since },
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();

      return this.mapDocuments(docs);
    });
  }

  /**
   * Protected helper for mapping multiple documents
   */
  protected mapDocuments(docs: unknown[]): IAuditLog[] {
    return docs
      .map(d => this.mapDocument(d))
      .filter((d): d is IAuditLog => d !== null);
  }
}

export default AuditLogRepository;
