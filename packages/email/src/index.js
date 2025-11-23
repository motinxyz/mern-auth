import { createTransport } from "nodemailer";
import CircuitBreaker from "opossum";
import {
  EmailDispatchError,
  EmailServiceInitializationError,
} from "@auth/utils";
import { sendVerificationEmail } from "./templates/verification.js";
import { config, logger, t as systemT } from "@auth/config";
import { EmailLog } from "@auth/database";
import { sendWithFailover, providers } from "./providers.js";

const emailUtilLogger = logger.child({ module: "email-utility" });

// Circuit breaker statistics (in-memory tracking)
let circuitBreakerStats = {
  totalFires: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  totalTimeouts: 0,
  totalRejects: 0,
  lastStateChange: null,
  circuitOpenTimestamp: null,
};

// Advanced circuit breaker options
const breakerOptions = {
  // Timeout: Max time to wait for email sending (30 seconds)
  timeout: 30000,

  // Error threshold: Open circuit if 50% of requests fail
  errorThresholdPercentage: 50,

  // Reset timeout: Wait 30 seconds before testing recovery
  resetTimeout: 30000,

  // Rolling window: Time window for counting errors (10 seconds)
  rollingCountTimeout: 10000,

  // Rolling buckets: Divide the window into 10 buckets
  rollingCountBuckets: 10,

  // Volume threshold: Minimum number of requests before opening circuit
  // Increased to prevent tripping on low traffic/startup
  volumeThreshold: 20,

  // Capacity: Maximum number of concurrent requests
  capacity: 50,

  // Name for identification in logs/metrics
  name: "emailCircuitBreaker",
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

  // Create a circuit breaker for the sendMail function with provider failover
  emailBreaker = new CircuitBreaker(async (mailOptions) => {
    return await sendWithFailover(mailOptions);
  }, breakerOptions);

  // Fallback function when the circuit is open
  emailBreaker.fallback(() => {
    throw new EmailDispatchError(systemT("email:errors.circuitBreakerOpen"));
  });

  // Log actual failures to see why it's tripping
  emailBreaker.on("failure", (error) => {
    circuitBreakerStats.totalFailures++;
    emailUtilLogger.error(
      { error: error.message, stack: error.stack },
      "Circuit breaker detected failure"
    );
  });

  // === Circuit Breaker Event Handlers with Statistics Tracking ===

  // Circuit opened - service is failing
  emailBreaker.on("open", () => {
    circuitBreakerStats.circuitOpenTimestamp = Date.now();
    circuitBreakerStats.lastStateChange = new Date().toISOString();

    emailUtilLogger.warn(
      {
        event: "circuit_breaker_open",
        state: "open",
        errorThreshold: breakerOptions.errorThresholdPercentage,
        resetTimeout: breakerOptions.resetTimeout,
        stats: {
          totalFires: circuitBreakerStats.totalFires,
          totalFailures: circuitBreakerStats.totalFailures,
          failureRate:
            circuitBreakerStats.totalFires > 0
              ? (
                  (circuitBreakerStats.totalFailures /
                    circuitBreakerStats.totalFires) *
                  100
                ).toFixed(2) + "%"
              : "0%",
        },
      },
      systemT("email:logs.circuitBreakerOpen")
    );
  });

  // Circuit half-open - testing recovery
  emailBreaker.on("halfOpen", () => {
    const openDuration = circuitBreakerStats.circuitOpenTimestamp
      ? (Date.now() - circuitBreakerStats.circuitOpenTimestamp) / 1000
      : 0;

    circuitBreakerStats.lastStateChange = new Date().toISOString();

    emailUtilLogger.warn(
      {
        event: "circuit_breaker_half_open",
        state: "half-open",
        openDurationSeconds: openDuration.toFixed(2),
      },
      systemT("email:logs.circuitBreakerHalfOpen")
    );
  });

  // Circuit closed - service recovered
  emailBreaker.on("close", () => {
    const totalOpenDuration = circuitBreakerStats.circuitOpenTimestamp
      ? (Date.now() - circuitBreakerStats.circuitOpenTimestamp) / 1000
      : 0;

    circuitBreakerStats.lastStateChange = new Date().toISOString();
    circuitBreakerStats.circuitOpenTimestamp = null;

    emailUtilLogger.info(
      {
        event: "circuit_breaker_closed",
        state: "closed",
        totalOpenDurationSeconds: totalOpenDuration.toFixed(2),
        stats: {
          totalSuccesses: circuitBreakerStats.totalSuccesses,
          totalFailures: circuitBreakerStats.totalFailures,
          successRate:
            circuitBreakerStats.totalFires > 0
              ? (
                  (circuitBreakerStats.totalSuccesses /
                    circuitBreakerStats.totalFires) *
                  100
                ).toFixed(2) + "%"
              : "0%",
        },
      },
      systemT("email:logs.circuitBreakerClosed")
    );
  });

  // Success event - email sent successfully
  emailBreaker.on("success", (result) => {
    circuitBreakerStats.totalSuccesses++;
    circuitBreakerStats.totalFires++;

    emailUtilLogger.debug(
      {
        event: "circuit_breaker_success",
        messageId: result?.messageId,
        totalSuccesses: circuitBreakerStats.totalSuccesses,
      },
      systemT("email:logs.circuitBreakerSuccess")
    );
  });

  // Failure event - email sending failed
  emailBreaker.on("failure", (error) => {
    circuitBreakerStats.totalFailures++;
    circuitBreakerStats.totalFires++;

    emailUtilLogger.error(
      {
        event: "circuit_breaker_failure",
        error: error.message,
        totalFailures: circuitBreakerStats.totalFailures,
      },
      systemT("email:logs.circuitBreakerFailure")
    );
  });

  // Timeout event - email sending timed out
  emailBreaker.on("timeout", () => {
    circuitBreakerStats.totalTimeouts++;

    emailUtilLogger.warn(
      {
        event: "circuit_breaker_timeout",
        timeoutMs: breakerOptions.timeout,
        totalTimeouts: circuitBreakerStats.totalTimeouts,
      },
      "Email sending timed out"
    );
  });

  // Reject event - circuit breaker rejected the request
  emailBreaker.on("reject", () => {
    circuitBreakerStats.totalRejects++;

    emailUtilLogger.warn(
      {
        event: "circuit_breaker_reject",
        totalRejects: circuitBreakerStats.totalRejects,
      },
      systemT("email:logs.circuitBreakerReject")
    );
  });

  emailUtilLogger.info(
    { host: config.smtp.host, port: config.smtp.port },
    systemT("email:logs.smtpConfigured")
  );

  /**
   * Verifies the SMTP connection on startup.
   */
  if (config.env !== "test") {
    try {
      await transport.verify();
      emailUtilLogger.info(systemT("email:logs.smtpConnectionVerified"));
    } catch (error) {
      emailUtilLogger.fatal(
        { err: error },
        systemT("email:errors.smtpConnectionFailed")
      );
      throw new EmailServiceInitializationError(
        systemT("email:errors.smtpConnectionFailed"),
        error
      );
    }
  }
};

/**
 * Sends an email using the configured SMTP transport with delivery tracking.
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} options.text - Plain text content of the email
 * @param {string} [options.userId] - User ID for tracking
 * @param {string} [options.type] - Email type (verification, passwordReset, etc.)
 * @param {object} [options.metadata] - Additional metadata to store
 * @returns {Promise<object>} - Nodemailer's send info object + emailLogId
 * @throws {EmailDispatchError} If email sending fails
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  userId,
  type = "notification",
  metadata = {},
}) => {
  const mailOptions = { from: config.emailFrom, to, subject, html, text };

  // Create email log entry
  let emailLog;
  try {
    emailLog = await EmailLog.create({
      userId,
      type,
      to,
      subject,
      status: "queued",
      metadata,
    });

    emailUtilLogger.debug(
      {
        to,
        from: mailOptions.from,
        subject,
        emailLogId: emailLog._id,
        type,
      },
      systemT("email:logs.attemptingSend")
    );
  } catch (logError) {
    emailUtilLogger.error(
      { err: logError, to, subject },
      "Failed to create email log entry"
    );
    // Continue sending even if logging fails
  }

  const startTime = Date.now();

  try {
    const info = await emailBreaker.fire(mailOptions);
    const duration = Date.now() - startTime;

    // Update log with success
    if (emailLog) {
      try {
        await EmailLog.updateOne(
          { _id: emailLog._id },
          {
            status: "sent",
            messageId: info.messageId,
            sentAt: new Date(),
            provider: info.provider || "primary",
            metadata: { ...metadata, durationMs: duration },
          }
        );
      } catch (updateError) {
        emailUtilLogger.error(
          { err: updateError, emailLogId: emailLog._id },
          "Failed to update email log"
        );
      }
    }

    emailUtilLogger.info(
      {
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response,
        durationMs: duration,
        emailLogId: emailLog?._id,
      },
      systemT("email:logs.sendSuccess")
    );

    return { ...info, emailLogId: emailLog?._id };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Update log with failure
    if (emailLog) {
      try {
        await EmailLog.updateOne(
          { _id: emailLog._id },
          {
            status: "failed",
            failedAt: new Date(),
            error: error.message,
            metadata: { ...metadata, durationMs: duration },
          }
        );
      } catch (updateError) {
        emailUtilLogger.error(
          { err: updateError, emailLogId: emailLog._id },
          "Failed to update email log"
        );
      }
    }

    emailUtilLogger.error(
      {
        err: error,
        mailOptions: mailOptions,
        durationMs: duration,
        emailLogId: emailLog?._id,
      },
      systemT("email:errors.dispatchFailed")
    );
    throw new EmailDispatchError(systemT("email:errors.dispatchFailed"), error);
  }
};

/**
 * Get circuit breaker health status and statistics
 * @returns {object} Circuit breaker health information
 */
export const getCircuitBreakerHealth = () => {
  if (!emailBreaker) {
    return {
      initialized: false,
      state: "unknown",
    };
  }

  const stats = emailBreaker.stats;
  const state = emailBreaker.opened
    ? "open"
    : emailBreaker.halfOpen
      ? "half-open"
      : "closed";

  return {
    initialized: true,
    state,
    inMemoryStats: {
      totalFires: circuitBreakerStats.totalFires,
      totalSuccesses: circuitBreakerStats.totalSuccesses,
      totalFailures: circuitBreakerStats.totalFailures,
      totalTimeouts: circuitBreakerStats.totalTimeouts,
      totalRejects: circuitBreakerStats.totalRejects,
      successRate:
        circuitBreakerStats.totalFires > 0
          ? (
              (circuitBreakerStats.totalSuccesses /
                circuitBreakerStats.totalFires) *
              100
            ).toFixed(2) + "%"
          : "0%",
      lastStateChange: circuitBreakerStats.lastStateChange,
    },
    circuitBreakerStats: {
      fires: stats.fires,
      successes: stats.successes,
      failures: stats.failures,
      rejects: stats.rejects,
      timeouts: stats.timeouts,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      semaphoreRejections: stats.semaphoreRejections,
      percentiles: stats.percentiles,
      latencyMean: stats.latencyMean,
    },
    config: {
      timeout: breakerOptions.timeout,
      errorThresholdPercentage: breakerOptions.errorThresholdPercentage,
      resetTimeout: breakerOptions.resetTimeout,
      volumeThreshold: breakerOptions.volumeThreshold,
      capacity: breakerOptions.capacity,
      rollingCountTimeout: breakerOptions.rollingCountTimeout,
      rollingCountBuckets: breakerOptions.rollingCountBuckets,
    },
  };
};

export { sendVerificationEmail } from "./templates/verification.js";
export { handleBounce, isEmailValid } from "./bounce-handler.js";
export { getProviderHealth } from "./providers.js";
export default {
  sendEmail,
  sendVerificationEmail,
  getCircuitBreakerHealth,
};
