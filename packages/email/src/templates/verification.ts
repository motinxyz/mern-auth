import { compileTemplate } from "../template-engine.js";

/**
 * Sends a verification email to a user.
 * @param {object} emailService - Email service instance
 * @param {object} user - User object containing email and name
 * @param {string} token - Verification token
 * @param {Function} t - Translation function
 * @param {object} config - Configuration object
 * @param {object} logger - Logger instance
 * @returns {Promise<object>} - Result from sendEmail
 */
export const sendVerificationEmail = async (
  emailService,
  user,
  token,
  t,
  config,
  logger
) => {
  const verificationLogger = logger.child({ module: "email-verification" });

  verificationLogger.debug(
    { userId: user.id, email: user.email },
    t("email:logs.preparingVerification")
  );

  const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const expiryMinutes = config.verificationTokenExpiresIn / 60;

  // Compile template with Handlebars
  const html = compileTemplate("verification", {
    subject: t("email:verification.subject"),
    name: user.name,
    verificationUrl,
    expiryMinutes,
  });

  const text = t("email:verification.text", {
    name: user.name,
    verificationUrl,
    count: expiryMinutes,
  });

  verificationLogger.debug(
    { userId: user.id },
    t("email:logs.sendingVerification")
  );

  return emailService.sendEmail({
    to: user.email,
    subject: t("email:verification.subject"),
    html,
    text,
    userId: user.id,
    type: "verification",
    metadata: { tokenExpiry: expiryMinutes },
  });
};

export default { sendVerificationEmail };
