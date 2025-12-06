import mongoose from "mongoose";
/**
 * Mongoose schema for the User model.
 *
 * DEFENSE IN DEPTH: This validation serves as the last line of defense.
 * Primary validation happens at the API layer (Zod), but this ensures
 * data integrity even if:
 * - A developer forgets to add Zod validation
 * - Data is inserted via scripts/migrations
 * - There's a race condition
 *
 * If Mongoose validation triggers, it indicates a bug that should be investigated.
 */
export interface UserDocument extends mongoose.Document {
    name: string;
    email: string;
    normalizedEmail: string;
    password?: string;
    role: string;
    isVerified: boolean;
    emailValid: boolean;
    emailBounceReason?: string;
    emailBouncedAt?: Date;
    emailComplaint: boolean;
    emailComplaintAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
/**
 * @type {mongoose.Model<IUser>}
 */
declare const User: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default User;
//# sourceMappingURL=user.model.d.ts.map