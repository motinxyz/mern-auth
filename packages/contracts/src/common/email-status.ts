/**
 * @auth/contracts - Email Status Types
 *
 * Status and classification types for email delivery tracking.
 */

/**
 * All possible email delivery statuses.
 * Used by IEmailLog and related email operations.
 *
 * Status flow: queued -> pending -> sent -> delivered
 *                                       -> bounced
 *                                       -> failed
 */
export type EmailStatus =
    | "queued"
    | "pending"
    | "sent"
    | "delivered"
    | "bounced"
    | "failed";

/**
 * Email bounce types for classification.
 *
 * - `soft`: Temporary delivery failure (mailbox full, server down)
 * - `hard`: Permanent delivery failure (invalid address)
 * - `complaint`: Spam complaint from recipient
 */
export type BounceType = "soft" | "hard" | "complaint";
