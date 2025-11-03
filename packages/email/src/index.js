import { createTransport } from "nodemailer";
import { config, logger, t as systemT } from "@auth/config";
import { EmailDispatchError } from "@auth/utils";
import { sendVerificationEmail } from "./templates/verification.js";

const emailUtilLogger = logger.child({ module: "email-utility" });

// Create a reusable transporter object using the SMTP transport configuration.
const transport = createTransport({
  pool: true, // Enable connection pooling for better performance
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

emailUtilLogger.info(
  { host: config.smtp.host, port: config.smtp.port },
  systemT("email:logs.smtpConfigured")
);

/**
 * Verifies the SMTP connection on startup.
 */
(async () => {
  if (config.env !== 'test') {
    try {
      await transport.verify();
      emailUtilLogger.info(systemT("email:logs.smtpConnectionVerified"));
    } catch (error) {
      emailUtilLogger.fatal(
        { err: error },
        systemT("email:errors.smtpConnectionFailed")
      );
      process.exit(1);
    }
  }
})();

/**
 * Sends an email using the configured SMTP transport.
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} options.text - Plain text content of the email
 * @returns {Promise<object>} - Nodemailer's send info object
 * @throws {EmailDispatchError} If email sending fails
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = { from: config.emailFrom, to, subject, html, text };
  emailUtilLogger.debug(
    { to, from: mailOptions.from, subject },
    systemT("email:logs.attemptingSend")
  );

  try {
    const info = await transport.sendMail(mailOptions);
    emailUtilLogger.info(
      { messageId: info.messageId, accepted: info.accepted },
      systemT("email:logs.sendSuccess")
    );
    return info;
  } catch (error) {
    emailUtilLogger.error({ err: error }, systemT("email:errors.dispatchFailed"));
    throw new EmailDispatchError(systemT("email:errors.dispatchFailed"), error);
  }
};

export { sendVerificationEmail } from './templates/verification.js';
export default { sendEmail, sendVerificationEmail };