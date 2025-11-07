import { config, logger, t as systemT } from "@auth/config";
import { sendEmail } from "../index.js";

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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t("email:verification.subject")}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333333;">
      <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #2c5282; margin-bottom: 20px; font-size: 24px;">Welcome to Mern Auth!</h1>
        <p style="margin-bottom: 16px;">Hello ${user.name},</p>
        <p style="margin-bottom: 24px;">Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="margin-bottom: 16px;">Or copy and paste this URL into your browser:</p>
        <p style="margin-bottom: 24px; word-break: break-all; color: #4a5568;">
          ${verificationUrl}
        </p>
        <p style="color: #718096; font-size: 14px;">
          This verification link will expire in ${expiryMinutes} minutes.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #718096; font-size: 14px;">
          If you didn't request this verification, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

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
  });
};

export default { sendVerificationEmail };
