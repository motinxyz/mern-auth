import { sendEmail } from "../../utils/sendMail.js";
import config from "../../config/env.js";
import logger from "../../config/logger.js";
import { EmailDispatchError } from "../../errors/index.js";

const emailServiceLogger = logger.child({ module: "email-service" });

/**
 * Constructs and sends a verification email using the provided user data, token,
 * and translation function. This service is typically called by a worker process.
 * @param {object} user - The user object.
 * @param {string} token - The verification token.
 * @param {function} t - The translation function.
 */
export const sendVerificationEmail = async (user, token, t) => {
  // later update with frontend url
  const verificationUrl = `${config.clientUrl}${config.port}/api/v1/auth/verify-email?token=${token}`;
  const minutes = Math.round(Number(config.verificationTokenExpiresIn) / 60);

  const templateContext = {
    name: user.name,
    verificationUrl,
    count: minutes,
  };

  const subject = t("email:content.verification.subject");
  const html = t("email:content.verification.html", templateContext);
  const text = t("email:content.verification.text", templateContext);

  emailServiceLogger.info(
    { to: user.email, subject },
    t("worker:logs.dispatchingEmail")
  );

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (error) {
    // Wrap the original error in our custom error class for better context.
    emailServiceLogger.error({ err: error }, t("email:errors.dispatchFailed"));
    throw new EmailDispatchError(t("email:errors.dispatchFailed"), error);
  }
};
