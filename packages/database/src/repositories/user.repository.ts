import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/utils";

/**
 * User Repository
 * Encapsulates all database operations for User model
 */
class UserRepository extends BaseRepository {
  constructor(model) {
    super(model, "UserRepository");
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return withSpan("UserRepository.findByEmail", async () => {
      return this.model.findOne({ email }).select("+password");
    });
  }

  /**
   * Find user by normalized email
   */
  async findByNormalizedEmail(normalizedEmail) {
    return withSpan("UserRepository.findByNormalizedEmail", async () => {
      return this.model.findOne({ normalizedEmail }).select("+password");
    });
  }

  /**
   * Mark email as bounced
   */
  async markEmailBounced(userId, reason) {
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
  async markEmailComplaint(userId) {
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
  async verifyEmail(userId) {
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
  async findWithPagination(filter: any = {}, options: any = {}) {
    return withSpan("UserRepository.findWithPagination", async () => {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit),
        this.model.countDocuments(filter),
      ]);

      return {
        users,
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
