import { createTransport } from "nodemailer";
import config from "../config/env.js";
import logger, { t as systemT } from "../config/system-logger.js";
import { EmailDispatchError } from "../errors/index.js";

const emailUtilLogger = logger.child({ module: "email-utility" });

// Create a reusable transporter object using the SMTP transport configuration.
// This single configuration works for both development (with .env) and production.
const transport = createTransport({
  pool: true, // Enable connection pooling for better performance
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
  systemT("email:logs.smtpConfigured")
);

/**
 * Verifies the SMTP connection on startup.
 * If the connection fails, it logs a fatal error and exits the process,
 * preventing the application from running in a state where it cannot send emails.
 */
(async () => {
  if (config.env !== 'test') { // Do not verify connection during tests
    try {
      await transport.verify();
      emailUtilLogger.info(systemT("email:logs.smtpConnectionVerified"));
    } catch (error) {
      emailUtilLogger.fatal(
        { err: error },
        systemT("email:errors.smtpConnectionFailed")
      );
      // In a production environment, it's better to crash and let a process manager
      // (like PM2 or a container orchestrator) restart the app, rather than running
      // in a broken state where emails can't be sent.
      process.exit(1);
    }
  }
})();

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
    // Re-throw the error so the calling service knows about the failure.
    throw new EmailDispatchError(systemT("email:errors.dispatchFailed"), error);
  }
};
