import nodemailer from "nodemailer";
import { config, logger } from "@auth/core";

const emailServiceLogger = logger.child({ module: "email-service" });

const transport = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Sends a verification email to a user.
 *
 * @param {object} user - The user object.
 * @param {string} user.name - The user's name.
 * @param {string} user.email - The user's email address.
 * @param {string} token - The verification token.
 * @param {function} t - The translation function.
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (user, token, t) => {
  const verificationLink = `${config.clientUrl}${config.port}/api/v1/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: config.emailFrom,
    to: user.email,
    subject: t("email:verification.subject"),
    html: t("email:verification.html", {
      name: user.name,
      verificationUrl: verificationLink,
    }),
  };

  await transport.sendMail(mailOptions);
  emailServiceLogger.info(`Verification email sent to ${user.email}`);
};
