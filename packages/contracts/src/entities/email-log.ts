/**
 * @auth/contracts - EmailLog Entity
 *
 * Tracks sent emails and their delivery status.
 */

import type { EmailStatus, BounceType } from "../common/index.js";

/**
 * Email log document interface.
 * Tracks sent emails and their delivery status.
 */
export interface IEmailLog {
    /** Unique log identifier */
    readonly _id: string;
    /** ID of the user this email was sent to */
    readonly userId?: string | undefined;
    /** Type of email (e.g., 'verification', 'welcome') */
    readonly type?: string | undefined;
    /** Provider-generated message ID */
    readonly messageId: string;
    /** Recipient email address */
    readonly to: string;
    /** Sender email address */
    readonly from: string;
    /** Email subject line */
    readonly subject: string;
    /** Template used to generate the email */
    readonly template?: string | undefined;
    /** Email provider that sent this email */
    readonly provider?: string | undefined;
    /** Current delivery status */
    readonly status: EmailStatus;
    /** Timestamp when email was sent to provider */
    readonly sentAt?: Date | undefined;
    /** Timestamp when email was delivered */
    readonly deliveredAt?: Date | undefined;
    /** Timestamp when email bounced */
    readonly bouncedAt?: Date | undefined;
    /** Type of bounce (soft = temporary, hard = permanent) */
    readonly bounceType?: BounceType | undefined;
    /** Reason for bounce */
    readonly bounceReason?: string | undefined;
    /** Error message if failed */
    readonly error?: string | undefined;
    /** Additional metadata */
    readonly metadata?: Readonly<Record<string, unknown>> | undefined;
    /** Log creation timestamp */
    readonly createdAt: Date;
    /** Last update timestamp */
    readonly updatedAt: Date;
}
