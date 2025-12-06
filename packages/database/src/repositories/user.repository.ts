import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/utils";
import type { Model } from "mongoose";
import type { UserDocument } from "../models/user.model.js";

/**
 * User Repository
 * Encapsulates all database operations for User model
 */
class UserRepository extends BaseRepository<UserDocument> {
  constructor(model: Model<UserDocument>) {
    super(model, "UserRepository");
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return withSpan("UserRepository.findByEmail", async () => {
      return this.model.findOne({ email }).select("+password");
    });
  }

  /**
   * Find user by normalized email
   */
  async findByNormalizedEmail(normalizedEmail: string) {
    return withSpan("UserRepository.findByNormalizedEmail", async () => {
      return this.model.findOne({ normalizedEmail }).select("+password");
    });
  }

  /**
   * Mark email as bounced
   */
  async markEmailBounced(userId: string, reason: string) {
    return withSpan("UserRepository.markEmailBounced", async () => {
      return this.model.findByIdAndUpdate(
        userId,
        {
          emailValid: false,
          emailBounceReason: reason,
          emailBouncedAt: new Date(),
        },
        { new: true }
      );
    });
  }

  /**
   * Mark email as complained
   */
  async markEmailComplaint(userId: string) {
    return withSpan("UserRepository.markEmailComplaint", async () => {
      return this.model.findByIdAndUpdate(
        userId,
        {
          emailComplaint: true,
          emailComplaintAt: new Date(),
        },
        { new: true }
      );
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string) {
    return withSpan("UserRepository.verifyEmail", async () => {
      return this.model.findByIdAndUpdate(
        userId,
        { isVerified: true },
        { new: true }
      );
    });
  }

  /**
   * Find users with pagination
   */
  async findWithPagination(filter: Record<string, unknown> = {}, options: { page?: number; limit?: number; sort?: Record<string, 1 | -1 | "asc" | "desc"> } = {}) {
    return withSpan("UserRepository.findWithPagination", async () => {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit),
        this.model.countDocuments(filter),
      ]);

      return {
        items: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    });
  }
}

export default UserRepository;
