/**
 * @auth/contracts - User Entity
 *
 * Represents a user in the authentication system.
 */

/**
 * User document interface.
 * Represents a user in the authentication system.
 */
export interface IUser {
    /** Unique user identifier (MongoDB ObjectId as string) */
    readonly _id: string;
    /** User's display name */
    readonly name: string;
    /** User's email address (unique) */
    readonly email: string;
    /** Hashed password */
    readonly password: string;
    /** Whether the user's email has been verified */
    readonly isVerified: boolean;
    /** User's preferred locale (e.g., 'en', 'es') */
    readonly locale: string;
    /** Account creation timestamp */
    readonly createdAt: Date;
    /** Last update timestamp */
    readonly updatedAt: Date;
    /** Whether the email address is valid (no bounces) */
    readonly emailValid?: boolean | undefined;
    /** Number of email bounces for this user */
    readonly emailBounceCount?: number | undefined;
    /** Timestamp of last email bounce */
    readonly lastEmailBounce?: Date | undefined;
    /** Whether a spam complaint was received */
    readonly emailComplaintReceived?: boolean | undefined;
    /** Timestamp of last spam complaint */
    readonly lastEmailComplaint?: Date | undefined;
}
