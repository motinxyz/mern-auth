import type { ILogger, IEmailLogRepository, IUserRepository } from "@auth/contracts";
import { EMAIL_MESSAGES } from "./constants/email.messages.js";
import type { BounceData, BounceHandlerResult } from "./types.js";

/**
 * Handle email bounce notifications
 * Uses repository methods to record bounces and update user status.
 */
export async function handleBounce(
  emailLogRepository: IEmailLogRepository,
  userRepository: IUserRepository,
  logger: ILogger,
  _t: (key: string) => string,
  bounceData: BounceData
): Promise<BounceHandlerResult> {
  const bounceLogger = logger.child({ module: "bounce-handler" });
  const { email, messageId, bounceType, bounceReason, timestamp } = bounceData;

  // Record bounce in email log using the dedicated repository method
  const emailLog = await emailLogRepository.recordBounce(messageId, {
    bounceType,
    bounceReason,
    bouncedAt: timestamp ?? new Date(),
  });

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
        EMAIL_MESSAGES.BOUNCE_HARD_RETRY_ALTERNATE
      );
      return {
        success: true,
        action: "retry_alternate_provider",
        emailLog,
      };
    }

    // Look up user and mark email as invalid
    const user = await userRepository.findByEmail(email);
    if (user) {
      // Note: We're reading the user but not updating here because 
      // IUserRepository doesn't have an update method. The caller
      // should handle the user update logic.
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

    return {
      success: true,
      action: "retry_alternate_provider",
      emailLog,
    };
  }

  // Handle complaints (spam reports)
  if (bounceType === "complaint") {
    const user = await userRepository.findByEmail(email);
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
 */
export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default { handleBounce, isEmailValid };
