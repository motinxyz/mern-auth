import BaseRepository from "./base.repository.js";
import type { Model } from "mongoose";
import type { UserDocument } from "../models/user.model.js";
/**
 * User Repository
 * Encapsulates all database operations for User model
 */
declare class UserRepository extends BaseRepository<UserDocument> {
    constructor(model: Model<UserDocument>);
    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Find user by normalized email
     */
    findByNormalizedEmail(normalizedEmail: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Mark email as bounced
     */
    markEmailBounced(userId: string, reason: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Mark email as complained
     */
    markEmailComplaint(userId: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Verify user email
     */
    verifyEmail(userId: string): Promise<import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Find users with pagination
     */
    findWithPagination(filter?: Record<string, unknown>, options?: {
        page?: number;
        limit?: number;
        sort?: Record<string, 1 | -1 | "asc" | "desc">;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
export default UserRepository;
//# sourceMappingURL=user.repository.d.ts.map