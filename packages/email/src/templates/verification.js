import { config, logger, t as systemT } from "@auth/config";
import { sendEmail } from "../index.js";
import { compileTemplate } from "../template-engine.js";

const verificationLogger = logger.child({ module: "email-verification" });

/**
 * Sends a verification email to a user.
 * @param {object} user - User object containing email and name
 * @param {string} token - Verification token
 * @param {Function} t - Translation function
 * @returns {Promise<object>} - Result from sendEmail
 */
export const sendVerificationEmail = async (user, token, t) => {
  verificationLogger.debug(
    { userId: user.id, email: user.email },
    systemT("email:logs.preparingVerification")
  );

  const verificationUrl = `${config.clientUrl}${config.port}/api/v1/verify-email?token=${token}`;
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
    systemT("email:logs.sendingVerification")
  );

  return sendEmail({
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
