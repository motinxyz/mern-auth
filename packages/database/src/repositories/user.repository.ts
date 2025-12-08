import BaseRepository from "./base.repository.js";
import { withSpan } from "@auth/utils";
import type { Model } from "mongoose";
import type { UserDocument } from "../models/user.model.js";
import type { IUser, FindOptions, PaginationResult } from "@auth/contracts";
import { mapUserDocument } from "../mappers.js";

/**
 * User Repository
 * 
 * Implements IUserRepository contract.
 * Returns IUser POJOs (not Mongoose documents).
 */
class UserRepository extends BaseRepository<UserDocument, IUser> {
  constructor(model: Model<UserDocument>) {
    super(model, "UserRepository");
  }

  /**
   * Map lean document to IUser
   */
  protected mapDocument(doc: unknown): IUser | null {
    return mapUserDocument(doc);
  }

  /**
   * Find user by email (IUserRepository contract method)
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return withSpan("UserRepository.findByEmail", async () => {
      const doc = await this.model
        .findOne({ email })
        .select("+password")
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Find user by normalized email
   */
  async findByNormalizedEmail(normalizedEmail: string): Promise<IUser | null> {
    return withSpan("UserRepository.findByNormalizedEmail", async () => {
      const doc = await this.model
        .findOne({ normalizedEmail })
        .select("+password")
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Mark email as bounced
   */
  async markEmailBounced(userId: string, reason: string): Promise<IUser | null> {
    return withSpan("UserRepository.markEmailBounced", async () => {
      const doc = await this.model
        .findByIdAndUpdate(
          userId,
          {
            emailValid: false,
            emailBounceReason: reason,
            emailBouncedAt: new Date(),
          },
          { new: true }
        )
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Mark email as complained
   */
  async markEmailComplaint(userId: string): Promise<IUser | null> {
    return withSpan("UserRepository.markEmailComplaint", async () => {
      const doc = await this.model
        .findByIdAndUpdate(
          userId,
          {
            emailComplaint: true,
            emailComplaintAt: new Date(),
          },
          { new: true }
        )
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<IUser | null> {
    return withSpan("UserRepository.verifyEmail", async () => {
      const doc = await this.model
        .findByIdAndUpdate(userId, { isVerified: true }, { new: true })
        .lean()
        .exec();
      return this.mapDocument(doc);
    });
  }

  /**
   * Find users with pagination (IUserRepository contract method)
   */
  async findWithPagination(
    filter: Record<string, unknown> = {},
    options: FindOptions & { page?: number; limit?: number } = {}
  ): Promise<{ items: IUser[]; pagination: PaginationResult }> {
    return withSpan("UserRepository.findWithPagination", async () => {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [docs, total] = await Promise.all([
        this.model
          .find(filter)
          .sort(sort as Record<string, 1 | -1>)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      return {
        items: this.mapDocuments(docs),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    });
  }

  /**
   * Protected helper for mapping multiple documents
   */
  protected mapDocuments(docs: unknown[]): IUser[] {
    return docs
      .map(d => this.mapDocument(d))
      .filter((d): d is IUser => d !== null);
  }
}

export default UserRepository;
