import { createTransport } from "nodemailer";
import CircuitBreaker from "opossum";
import { config, logger, t as systemT } from "@auth/config";
import { EmailDispatchError } from "@auth/utils";
import { sendVerificationEmail } from "./templates/verification.js";

const emailUtilLogger = logger.child({ module: "email-utility" });

// Circuit breaker options for email sending
const breakerOptions = {
  timeout: 10000, // If our function takes longer than 10 seconds, trigger a failure
  errorThresholdPercentage: 50, // If 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again.
};

let emailBreaker;
let transport;

export const initEmailService = async () => {
  // Create a reusable transporter object using the SMTP transport configuration.
  // Nodemailer's connection pooling inherently provides a form of bulkheading
  // by limiting the number of concurrent connections to the SMTP server.
  transport = createTransport({
    pool: true, // Enable connection pooling for better performance
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  // Create a circuit breaker for the sendMail function
  emailBreaker = new CircuitBreaker(async (mailOptions) => {
    return await transport.sendMail(mailOptions);
  }, breakerOptions);

  // Fallback function when the circuit is open
  emailBreaker.fallback(() => {
    throw new EmailDispatchError(systemT("email:errors.circuitBreakerOpen"));
  });

  // Log circuit breaker state changes
  emailBreaker.on("open", () =>
    emailUtilLogger.warn(systemT("email:logs.circuitBreakerOpen"))
  );
  emailBreaker.on("halfOpen", () =>
    emailUtilLogger.warn(systemT("email:logs.circuitBreakerHalfOpen"))
  );
  emailBreaker.on("close", () =>
    emailUtilLogger.info(systemT("email:logs.circuitBreakerClosed"))
  );

  emailUtilLogger.info(
    { host: config.smtp.host, port: config.smtp.port },
    systemT("email:logs.smtpConfigured")
  );

  /**
   * Verifies the SMTP connection on startup.
   */
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
};

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
    const info = await emailBreaker.fire(mailOptions);
    emailUtilLogger.info(
      { messageId: info.messageId, accepted: info.accepted, response: info.response },
      systemT("email:logs.sendSuccess")
    );
    return info;
  } catch (error) {
    emailUtilLogger.error(
      { err: error, mailOptions: mailOptions },
      systemT("email:errors.dispatchFailed")
    );
    throw new EmailDispatchError(systemT("email:errors.dispatchFailed"), error);
  }
};

export { sendVerificationEmail } from './templates/verification.js';
export default { sendEmail, sendVerificationEmail };