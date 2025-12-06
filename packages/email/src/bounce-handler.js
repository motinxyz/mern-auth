import { EMAIL_MESSAGES } from "./constants/email.messages.js";

/**
 * Handle email bounce notifications
 * @param {object} emailLogRepository - Email log repository
 * @param {object} userRepository - User repository
 * @param {object} logger - Logger instance
 * @param {Function} t - Translation function
 * @param {object} bounceData - Bounce notification data
 */
export async function handleBounce(
  emailLogRepository,
  userRepository,
  logger,
  t,
  bounceData
) {
  const bounceLogger = logger.child({ module: "bounce-handler" });
  const { email, messageId, bounceType, bounceReason, timestamp } = bounceData;

  // Update email log
  const emailLog = await emailLogRepository.findOneAndUpdate(
    { messageId },
    {
      status: "bounced",
      bouncedAt: timestamp || new Date(),
      bounceType,
      bounceReason,
    }
  );

  if (!emailLog) {
    bounceLogger.warn({ messageId }, EMAIL_MESSAGES.BOUNCE_LOG_NOT_FOUND);
    return { success: false, reason: "Email log not found" };
  }

  // Handle hard bounces (permanent failures)
  if (bounceType === "hard") {
    const wasSentViaResend =
      emailLog.provider === "resend-api" || !emailLog.provider;

    if (wasSentViaResend) {
      bounceLogger.info(
        { email, messageId, bounceReason },
        EMAIL_MESSAGES.BOUNCE_HARD_RETRY_SMTP.replace(
          "SMTP",
          "Alternate Provider"
        )
      );
      return {
        success: true,
        action: "retry_alternate_provider",
        emailLog,
      };
    }

    // Mark user email as invalid
    const user = await userRepository.findOneAndUpdate(
      { email },
      {
        emailValid: false,
        emailBounceCount: { $inc: 1 },
        lastEmailBounce: timestamp || new Date(),
      }
    );

    if (user) {
      bounceLogger.warn(
        { email, userId: user._id, bounceReason },
        EMAIL_MESSAGES.BOUNCE_USER_MARKED_INVALID
      );
    }

    return {
      success: true,
      action: "marked_invalid",
      emailLog,
      user,
    };
  }

  // Handle soft bounces (temporary failures)
  if (bounceType === "soft") {
    bounceLogger.info(
      { email, messageId, bounceReason },
      EMAIL_MESSAGES.BOUNCE_SOFT_RECORDED
    );

    // If it was MailerSend, we should retry with Resend (or vice versa)
    // The WebhooksController will determine which provider to use based on this action
    return {
      success: true,
      action: "retry_alternate_provider",
      emailLog,
    };
  }

  // Handle complaints (spam reports)
  if (bounceType === "complaint") {
    const user = await userRepository.findOneAndUpdate(
      { email },
      {
        emailValid: false,
        emailComplaintReceived: true,
        lastEmailComplaint: timestamp || new Date(),
      }
    );

    if (user) {
      bounceLogger.warn(
        { email, userId: user._id },
        EMAIL_MESSAGES.BOUNCE_SPAM_COMPLAINT
      );
    }

    return {
      success: true,
      action: "unsubscribed",
      emailLog,
      user,
    };
  }

  return {
    success: true,
    action: "logged",
    emailLog,
  };
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid
 */
export function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default { handleBounce, isEmailValid };
