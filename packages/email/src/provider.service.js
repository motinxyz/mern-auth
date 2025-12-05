import { createTransport } from "nodemailer";
import { Resend } from "resend";
import {
  EmailDispatchError,
  ConfigurationError,
  withSpan,
  addSpanAttributes,
} from "@auth/utils";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";

/**
 * Provider Service
 * Manages email providers (SMTP, Resend) with failover support
 */
class ProviderService {
  constructor(options = {}) {
    if (!options.config) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "config")
      );
    }
    if (!options.logger) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "logger")
      );
    }
    this.config = options.config;
    this.logger = options.logger.child({ module: "email-providers" });
    this.providers = [];
    this.transport = null;
  }

  /**
   * Initialize providers
   */
  async initialize() {
    // Initialize Resend API if configured
    if (this.config.resendApiKey) {
      const resendProvider = this.createResendProvider();
      this.providers.push(resendProvider);
      this.logger.info(EMAIL_MESSAGES.RESEND_INITIALIZED);
    }

    // Initialize SMTP transport if configured
    if (this.config.smtp?.host && this.config.smtp?.user) {
      this.transport = createTransport({
        pool: true,
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.port === 465,
        auth: {
          user: this.config.smtp.user,
          pass: this.config.smtp.pass,
        },
      });

      this.logger.info(
        { host: this.config.smtp.host, port: this.config.smtp.port },
        EMAIL_MESSAGES.SMTP_CONFIGURED
      );

      // Verify SMTP connection (skip in test)
      if (this.config.env !== "test") {
        try {
          await this.transport.verify();
          this.logger.info(EMAIL_MESSAGES.SMTP_CONNECTION_VERIFIED);

          // Add SMTP as provider
          this.providers.push({
            name: "smtp",
            transport: this.transport,
          });
        } catch (error) {
          this.logger.warn({ err: error }, EMAIL_ERRORS.SMTP_CONNECTION_FAILED);
        }
      } else {
        // In test, add SMTP without verification
        this.providers.push({
          name: "smtp",
          transport: this.transport,
        });
      }
    } else {
      this.logger.info(EMAIL_MESSAGES.SMTP_NOT_CONFIGURED);
    }

    if (this.providers.length === 0) {
      throw new ConfigurationError(EMAIL_ERRORS.NO_PROVIDERS);
    }

    this.logger.info(
      EMAIL_MESSAGES.PROVIDERS_INITIALIZED.replace(
        "{count}",
        this.providers.length
      ).replace("{providers}", this.providers.map((p) => p.name).join(", "))
    );
  }

  /**
   * Create Resend provider
   */
  createResendProvider() {
    const resend = new Resend(this.config.resendApiKey);
    const RESEND_MAX_RETRIES = 3;
    const RESEND_RETRY_DELAY_MS = 1000;
    const RESEND_TIMEOUT_MS = 30000;

    const retryWithBackoff = async (fn, retries = RESEND_MAX_RETRIES) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          const isLastAttempt = attempt === retries;
          const isRetryable =
            error.statusCode >= 500 || error.code === "ETIMEDOUT";

          if (isLastAttempt || !isRetryable) {
            throw error;
          }

          const delay = RESEND_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.warn(
            {
              provider: "resend-api",
              attempt,
              maxRetries: retries,
              delayMs: delay,
              error: error.message,
            },
            EMAIL_MESSAGES.RESEND_RETRYING
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };

    const withTimeout = (promise, timeoutMs) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new EmailDispatchError(EMAIL_ERRORS.RESEND_TIMEOUT)),
            timeoutMs
          )
        ),
      ]);
    };

    return {
      name: "resend-api",
      transport: {
        sendMail: async (mailOptions) => {
          const { from, to, subject, html, text } = mailOptions;
          const startTime = Date.now();

          try {
            const data = await retryWithBackoff(async () => {
              return await withTimeout(
                resend.emails.send({ from, to, subject, html, text }),
                RESEND_TIMEOUT_MS
              );
            });

            const duration = Date.now() - startTime;

            if (data.error) {
              this.logger.error(
                {
                  provider: "resend-api",
                  error: data.error,
                  to,
                  subject,
                  durationMs: duration,
                },
                EMAIL_ERRORS.RESEND_API_ERROR,
                data.error
              );
              throw new EmailDispatchError(
                EMAIL_ERRORS.RESEND_API_ERROR,
                data.error
              );
            }

            this.logger.debug(
              {
                provider: "resend-api",
                messageId: data.data.id,
                to,
                durationMs: duration,
              },
              EMAIL_MESSAGES.RESEND_SENT
            );

            return { messageId: data.data.id, provider: "resend-api" };
          } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(
              {
                provider: "resend-api",
                error: error.message,
                to,
                subject,
                durationMs: duration,
              },
              EMAIL_ERRORS.RESEND_FAILED
            );

            if (error instanceof EmailDispatchError) {
              throw error;
            }
            throw new EmailDispatchError(EMAIL_ERRORS.RESEND_FAILED, error);
          }
        },
        verify: async () => {
          if (!this.config.resendApiKey) {
            throw new EmailDispatchError(EMAIL_ERRORS.RESEND_API_KEY_MISSING);
          }
          return true;
        },
      },
    };
  }

  /**
   * Send email with failover
   */
  async sendWithFailover(mailOptions) {
    return withSpan("ProviderService.sendWithFailover", async () => {
      addSpanAttributes({
        "email.to_hash": mailOptions.to?.substring(0, 3) + "***",
      });

      const errors = [];

      for (const provider of this.providers) {
        try {
          this.logger.debug(
            { provider: provider.name, to: mailOptions.to },
            EMAIL_MESSAGES.PROVIDER_ATTEMPT.replace("{provider}", provider.name)
          );

          const result = await provider.transport.sendMail(mailOptions);

          addSpanAttributes({
            "email.provider": provider.name,
            "email.message_id": result.messageId,
          });

          this.logger.info(
            { provider: provider.name, messageId: result.messageId },
            EMAIL_MESSAGES.PROVIDER_SUCCESS.replace("{provider}", provider.name)
          );

          return { ...result, provider: provider.name };
        } catch (error) {
          errors.push({ provider: provider.name, error });
          this.logger.warn(
            { provider: provider.name, error: error.message },
            EMAIL_MESSAGES.PROVIDER_FAILOVER.replace(
              "{provider}",
              provider.name
            )
          );
        }
      }

      // All providers failed
      const errorDetails = errors
        .map((e) => `${e.provider}: ${e.error.message}`)
        .join("; ");
      throw new EmailDispatchError(
        EMAIL_ERRORS.ALL_PROVIDERS_FAILED.replace("{details}", errorDetails),
        errors
      );
    });
  }

  /**
   * Get provider health
   */
  async getHealth() {
    const health = {
      healthy: true,
      providers: [],
    };

    for (const provider of this.providers) {
      try {
        if (provider.transport.verify) {
          await provider.transport.verify();
        }
        health.providers.push({
          name: provider.name,
          healthy: true,
        });
      } catch (error) {
        health.healthy = false;
        health.providers.push({
          name: provider.name,
          healthy: false,
          error: error.message,
        });
      }
    }

    return health;
  }

  /**
   * Get all providers
   */
  getProviders() {
    return this.providers;
  }
}

export default ProviderService;
