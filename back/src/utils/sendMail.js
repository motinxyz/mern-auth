import { createTransport } from "nodemailer";
import config from "../config/env.js";
import logger from "../config/logger.js";
import { t as systemT } from "../config/system-logger.js";

const emailUtilLogger = logger.child({ module: "email-utility" });

// Create a reusable transporter object using the SMTP transport configuration.
// This single configuration works for both development (with .env) and production.
const transport = createTransport({
  pool: true, // Enable connection pooling
  host: config.smtp.host,
  port: config.smtp.port,
  // `secure: true` is recommended for port 465.
  // For other ports like 587, you might use `secure: false` with `requireTLS: true`.
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

emailUtilLogger.info(
  { host: config.smtp.host, port: config.smtp.port },
  systemT("common:email.smtpConfigured")
);

/**
 * Verifies the SMTP connection and configuration.
 */
const verifyConnection = async () => {
  try {
    await transport.verify();
    emailUtilLogger.debug(systemT("common:email.smtpConnectionVerified"));
  } catch (error) {
    emailUtilLogger.error(
      { err: error },
      systemT("common:email.smtpConnectionFailed")
    );
    // In a real-world scenario, you might want to handle this more gracefully,
    // e.g., by trying to re-establish the connection or notifying an admin.
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = { from: config.emailFrom, to, subject, html, text };
  emailUtilLogger.debug(
    { to, from: mailOptions.from, subject },
    systemT("common:email.attemptingSend")
  );

  try {
    // Ensure the connection is alive before sending
    await verifyConnection();

    const info = await transport.sendMail(mailOptions);
    emailUtilLogger.info(
      { messageId: info.messageId, accepted: info.accepted },
      systemT("common:email.sendSuccess")
    );
    return info;
  } catch (error) {
    emailUtilLogger.error({ err: error }, systemT("common:email.sendFail"));
    // Re-throw the error so the calling service knows about the failure.
    throw error;
  }
};

export default sendEmail;
