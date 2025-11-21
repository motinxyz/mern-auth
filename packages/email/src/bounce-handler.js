import { EmailLog } from "@auth/database";
import { User } from "@auth/database";
import { logger } from "@auth/config";

const bounceLogger = logger.child({ module: "bounce-handler" });

/**
 * Handle email bounce notifications
 * @param {object} bounceData - Bounce notification data
 * @param {string} bounceData.email - Email address that bounced
 * @param {string} bounceData.messageId - Message ID from email service
 * @param {string} bounceData.bounceType - Type of bounce (hard, soft, complaint)
 * @param {string} bounceData.bounceReason - Reason for bounce
 * @param {Date} [bounceData.timestamp] - Timestamp of bounce
 */
export async function handleBounce(bounceData) {
  const { email, messageId, bounceType, bounceReason, timestamp } = bounceData;

  // Update email log
  const emailLog = await EmailLog.findOneAndUpdate(
    { messageId },
    {
      status: "bounced",
      bouncedAt: timestamp || new Date(),
      bounceType,
      bounceReason,
    },
    { new: true }
  );

  if (!emailLog) {
    bounceLogger.warn({ messageId }, "Email log not found for bounce");
    return { success: false, reason: "Email log not found" };
  }

  // Handle hard bounces (permanent failures)
  if (bounceType === "hard") {
    await User.updateOne(
      { email },
      {
        emailValid: false,
        emailBounceReason: bounceReason,
        emailBouncedAt: timestamp || new Date(),
      }
    );

    bounceLogger.warn(
      {
        email,
        messageId,
        bounceReason,
      },
      "Hard bounce - marked email as invalid"
    );

    return { success: true, action: "email_marked_invalid" };
  }

  // Handle soft bounces (temporary failures)
  if (bounceType === "soft") {
    bounceLogger.info(
      {
        email,
        messageId,
        bounceReason,
      },
      "Soft bounce - will retry"
    );

    return { success: true, action: "logged_for_retry" };
  }

  // Handle complaints (spam reports)
  if (bounceType === "complaint") {
    await User.updateOne(
      { email },
      {
        emailComplaint: true,
        emailComplaintAt: timestamp || new Date(),
      }
    );

    bounceLogger.warn(
      {
        email,
        messageId,
      },
      "Complaint received - user marked email as spam"
    );

    return { success: true, action: "complaint_recorded" };
  }

  return { success: false, reason: "Unknown bounce type" };
}

/**
 * Check if an email address is valid for sending
 * @param {string} email - Email address to check
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function isEmailValid(email) {
  const user = await User.findOne({ email }).select(
    "emailValid emailComplaint emailBounceReason"
  );

  if (!user) {
    return { valid: true }; // Email not in system, assume valid
  }

  if (!user.emailValid) {
    return { valid: false, reason: `Email bounced: ${user.emailBounceReason}` };
  }

  if (user.emailComplaint) {
    return { valid: false, reason: "User marked emails as spam" };
  }

  return { valid: true };
}
