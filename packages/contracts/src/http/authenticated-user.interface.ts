/**
 * @auth/contracts - Authenticated User Interface
 */

export interface IAuthenticatedUser {
    /** Unique user identifier (MongoDB ObjectId) */
    _id: string;
    /** User's email address */
    email: string;
    /** User's display name */
    name?: string;
    /** User's role */
    role?: string;
    /** Standard ID (alias for _id) */
    id?: string;
    /** Allow for additional properties injected by strategies */
    [key: string]: unknown;
}
