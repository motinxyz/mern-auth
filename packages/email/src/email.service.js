import {
  EmailDispatchError,
  createCircuitBreaker,
  CircuitBreakerError,
  ConfigurationError,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
} from "@auth/utils";
import { i18nInstance } from "@auth/config";
import {
  emailSendTotal,
  emailSendDuration,
  emailCircuitBreakerState,
} from "@auth/config";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";
import { compileTemplate, initializeTemplates } from "./template-engine.js";

/**
 * Email Service
 * Production-grade email service with circuit breaker, provider failover, and delivery tracking
 */
class EmailService {
  constructor(options = {}) {
    if (!options.config) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "config")
      );
    }
    if (!options.logger) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "logger")
      );
    }
    if (!options.emailLogRepository) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "emailLogRepository")
      );
    }
    if (!options.providerService) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "providerService")
      );
    }

    this.config = options.config;
    this.logger = options.logger.child({ module: "email-service" });
    this.emailLogRepository = options.emailLogRepository;
    this.providerService = options.providerService;

    // Circuit breaker configuration (externalized)
    this.circuitBreakerOptions = {
      timeout: options.circuitBreakerTimeout || 30000,
      errorThresholdPercentage: options.circuitBreakerErrorThreshold || 50,
      resetTimeout: options.circuitBreakerResetTimeout || 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      volumeThreshold: options.circuitBreakerVolumeThreshold || 20,
      capacity: options.circuitBreakerCapacity || 50,
      name: "emailCircuitBreaker",
    };

    this.emailBreaker = null;
    this.circuitBreakerStats = {
      totalFires: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalTimeouts: 0,
      totalRejects: 0,
      lastStateChange: null,
      circuitOpenTimestamp: null,
    };
  }

  /**
   * Initialize email service
   */
  async initialize() {
    // Initialize templates (pass logger)
    await initializeTemplates({ logger: this.logger });

    // Initialize providers
    await this.providerService.initialize();

    // Create circuit breaker using shared utility
    this.emailBreaker = createCircuitBreaker(async (mailOptions) => {
      return await this.providerService.sendWithFailover(mailOptions);
    }, this.circuitBreakerOptions);

    // Fallback when circuit is open
    this.emailBreaker.fallback(() => {
      throw new CircuitBreakerError(EMAIL_ERRORS.CB_OPEN);
    });

    this.setupCircuitBreakerEvents();

    this.logger.info(EMAIL_MESSAGES.SERVICE_INITIALIZED);
  }

  /**
   * Setup circuit breaker event handlers
   */
  setupCircuitBreakerEvents() {
    this.emailBreaker.on("open", () => {
      this.circuitBreakerStats.circuitOpenTimestamp = Date.now();
      this.circuitBreakerStats.lastStateChange = new Date().toISOString();

      // Emit metric
      emailCircuitBreakerState.inc({ event: "open" });

      this.logger.warn(
        {
          event: "circuit_breaker_open",
          state: "open",
          stats: {
            totalFires: this.circuitBreakerStats.totalFires,
            totalFailures: this.circuitBreakerStats.totalFailures,
            failureRate:
              this.circuitBreakerStats.totalFires > 0
                ? (
                    (this.circuitBreakerStats.totalFailures /
                      this.circuitBreakerStats.totalFires) *
                    100
                  ).toFixed(2) + "%"
                : "0%",
          },
        },
        EMAIL_MESSAGES.CB_OPEN
      );
    });

    this.emailBreaker.on("halfOpen", () => {
      const openDuration = this.circuitBreakerStats.circuitOpenTimestamp
        ? (Date.now() - this.circuitBreakerStats.circuitOpenTimestamp) / 1000
        : 0;

      this.circuitBreakerStats.lastStateChange = new Date().toISOString();

      this.logger.warn(
        {
          event: "circuit_breaker_half_open",
          state: "half-open",
          openDurationSeconds: openDuration.toFixed(2),
        },
        EMAIL_MESSAGES.CB_HALF_OPEN
      );
    });

    this.emailBreaker.on("close", () => {
      const totalOpenDuration = this.circuitBreakerStats.circuitOpenTimestamp
        ? (Date.now() - this.circuitBreakerStats.circuitOpenTimestamp) / 1000
        : 0;

      this.circuitBreakerStats.lastStateChange = new Date().toISOString();
      this.circuitBreakerStats.circuitOpenTimestamp = null;

      this.logger.info(
        {
          event: "circuit_breaker_closed",
          state: "closed",
          totalOpenDurationSeconds: totalOpenDuration.toFixed(2),
          stats: {
            totalSuccesses: this.circuitBreakerStats.totalSuccesses,
            totalFailures: this.circuitBreakerStats.totalFailures,
            successRate:
              this.circuitBreakerStats.totalFires > 0
                ? (
                    (this.circuitBreakerStats.totalSuccesses /
                      this.circuitBreakerStats.totalFires) *
                    100
                  ).toFixed(2) + "%"
                : "0%",
          },
        },
        EMAIL_MESSAGES.CB_CLOSED
      );
    });

    this.emailBreaker.on("success", (result) => {
      this.circuitBreakerStats.totalSuccesses++;
      this.circuitBreakerStats.totalFires++;

      this.logger.debug(
        {
          event: "circuit_breaker_success",
          messageId: result?.messageId,
          totalSuccesses: this.circuitBreakerStats.totalSuccesses,
        },
        EMAIL_MESSAGES.CB_SUCCESS
      );
    });

    this.emailBreaker.on("failure", (error) => {
      this.circuitBreakerStats.totalFailures++;
      this.circuitBreakerStats.totalFires++;

      this.logger.error(
        {
          event: "circuit_breaker_failure",
          error: error.message,
          totalFailures: this.circuitBreakerStats.totalFailures,
        },
        EMAIL_MESSAGES.CB_FAILURE
      );
    });

    this.emailBreaker.on("timeout", () => {
      this.circuitBreakerStats.totalTimeouts++;

      this.logger.warn(
        {
          event: "circuit_breaker_timeout",
          timeoutMs: 30000,
          totalTimeouts: this.circuitBreakerStats.totalTimeouts,
        },
        EMAIL_MESSAGES.CB_TIMEOUT
      );
    });

    this.emailBreaker.on("reject", () => {
      this.circuitBreakerStats.totalRejects++;

      this.logger.warn(
        {
          event: "circuit_breaker_reject",
          totalRejects: this.circuitBreakerStats.totalRejects,
        },
        EMAIL_MESSAGES.CB_REJECT
      );
    });
  }

  /**
   * Send email with delivery tracking
   */
  async sendEmail({
    to,
    subject,
    html,
    text,
    userId,
    type = "notification",
    metadata = {},
  }) {
    return withSpan(
      "email-service.send-email",
      async (span) => {
        // Add span attributes for observability
        addSpanAttributes({
          "email.type": type,
          "email.recipient_hash": hashSensitiveData(to),
          "user.id": userId || "anonymous",
        });

        const mailOptions = {
          from: this.config.emailFrom,
          to,
          subject,
          html,
          text,
        };

        // Create email log entry
        let emailLog;
        try {
          emailLog = await this.emailLogRepository.create({
            userId,
            type,
            to,
            subject,
            status: "queued",
            metadata: {
              ...metadata,
              html,
              text,
            },
          });

          this.logger.debug(
            {
              to,
              from: mailOptions.from,
              subject,
              emailLogId: emailLog._id,
              type,
            },
            EMAIL_MESSAGES.ATTEMPTING_SEND
          );
        } catch (logError) {
          this.logger.error(
            { err: logError, to, subject },
            EMAIL_ERRORS.LOG_CREATION_FAILED
          );
          // Continue sending even if logging fails
        }

        const startTime = Date.now();

        try {
          const info = await this.emailBreaker.fire(mailOptions);
          const duration = Date.now() - startTime;

          // Add delivery success attributes
          addSpanAttributes({
            "email.provider": info.provider || "unknown",
            "email.status": "sent",
            "email.message_id": info.messageId,
            "email.duration_ms": duration,
          });

          // Emit metrics
          emailSendTotal.add(1, {
            type,
            provider: info.provider || "unknown",
            status: "sent",
          });
          emailSendDuration.record(duration / 1000, {
            type,
            provider: info.provider || "unknown",
          }); // Convert to seconds

          // Update log with success
          if (emailLog) {
            try {
              await this.emailLogRepository.updateStatus(emailLog._id, "sent", {
                messageId: info.messageId,
                provider: info.provider || "primary",
                metadata: { ...metadata, durationMs: duration },
              });
            } catch (updateError) {
              this.logger.error(
                { err: updateError, emailLogId: emailLog._id },
                EMAIL_ERRORS.LOG_UPDATE_FAILED
              );
            }
          }

          this.logger.info(
            {
              messageId: info.messageId,
              accepted: info.accepted,
              response: info.response,
              durationMs: duration,
              emailLogId: emailLog?._id,
            },
            EMAIL_MESSAGES.SEND_SUCCESS
          );

          return { ...info, emailLogId: emailLog?._id };
        } catch (error) {
          const duration = Date.now() - startTime;

          // Add failure attributes
          addSpanAttributes({
            "email.status": "failed",
            "email.error": error.message,
            "email.duration_ms": duration,
          });

          // Emit failure metrics
          emailSendTotal.add(1, {
            type,
            provider: "unknown",
            status: "failed",
          });
          emailSendDuration.record(duration / 1000, {
            type,
            provider: "unknown",
          }); // Convert to seconds

          // Update log with failure
          if (emailLog) {
            try {
              await this.emailLogRepository.updateById(emailLog._id, {
                status: "failed",
                failedAt: new Date(),
                error: error.message,
                metadata: { ...metadata, durationMs: duration },
              });
            } catch (updateError) {
              this.logger.error(
                { err: updateError, emailLogId: emailLog._id },
                EMAIL_ERRORS.LOG_UPDATE_FAILED
              );
            }
          }

          this.logger.error(
            {
              err: error,
              mailOptions: mailOptions,
              durationMs: duration,
              emailLogId: emailLog?._id,
            },
            EMAIL_ERRORS.DISPATCH_FAILED
          );
          throw new EmailDispatchError(EMAIL_ERRORS.DISPATCH_FAILED, error);
        }
      },
      { tracerName: "email-service", component: "email" }
    );
  }

  /**
   * Send verification email
   * @param {object} user - User object containing email and name
   * @param {string} token - Verification token
   * @param {string} locale - User's locale
   * @returns {Promise<object>} - Result from sendEmail
   */
  async sendVerificationEmail(user, token, locale = "en") {
    return withSpan(
      "email-service.send-verification",
      async (span) => {
        // Add span attributes
        addSpanAttributes({
          "email.type": "verification",
          "user.id": user.id,
          "user.email_hash": hashSensitiveData(user.email),
          "email.locale": locale,
        });

        const verificationLogger = this.logger.child({
          module: "email-verification",
        });

        // Get translator for user's locale
        const t = await i18nInstance.getFixedT(locale);

        verificationLogger.debug(
          { userId: user.id, email: user.email },
          EMAIL_MESSAGES.PREPARING_VERIFICATION
        );

        const verificationUrl = `${this.config.clientUrl}/verify-email?token=${token}`;
        const expiryMinutes = this.config.verificationTokenExpiresIn / 60;

        // Compile template with Handlebars
        const html = await compileTemplate("verification", {
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
          EMAIL_MESSAGES.SENDING_VERIFICATION
        );

        return this.sendEmail({
          to: user.email,
          subject: t("email:verification.subject"),
          html,
          text,
          userId: user.id,
          type: "verification",
          metadata: { tokenExpiry: expiryMinutes },
        });
      },
      { tracerName: "email-service", component: "email" }
    );
  }

  /**
   * Get circuit breaker health
   */
  getCircuitBreakerHealth() {
    if (!this.emailBreaker) {
      return {
        initialized: false,
        state: "unknown",
      };
    }

    const stats = this.emailBreaker.stats;
    const state = this.emailBreaker.opened
      ? "open"
      : this.emailBreaker.halfOpen
        ? "half-open"
        : "closed";

    return {
      initialized: true,
      state,
      inMemoryStats: {
        totalFires: this.circuitBreakerStats.totalFires,
        totalSuccesses: this.circuitBreakerStats.totalSuccesses,
        totalFailures: this.circuitBreakerStats.totalFailures,
        totalTimeouts: this.circuitBreakerStats.totalTimeouts,
        totalRejects: this.circuitBreakerStats.totalRejects,
        successRate:
          this.circuitBreakerStats.totalFires > 0
            ? (
                (this.circuitBreakerStats.totalSuccesses /
                  this.circuitBreakerStats.totalFires) *
                100
              ).toFixed(2) + "%"
            : "0%",
        lastStateChange: this.circuitBreakerStats.lastStateChange,
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
    };
  }

  /**
   * Get provider health
   */
  async getProviderHealth() {
    return await this.providerService.getHealth();
  }

  /**
   * Get overall health
   */
  async getHealth() {
    const circuitHealth = this.getCircuitBreakerHealth();
    const providerHealth = await this.getProviderHealth();

    return {
      healthy: circuitHealth.initialized && providerHealth.healthy,
      circuitBreaker: circuitHealth,
      providers: providerHealth,
    };
  }
}

export default EmailService;
