import {
  EmailDispatchError,
  createCircuitBreaker,
  CircuitBreakerError,
  ConfigurationError,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
} from "@auth/utils";
import type { ILogger, IEmailLogRepository } from "@auth/contracts";
import { i18nInstance } from "@auth/config";
import {
  emailSendTotal,
  emailSendDuration,
  emailCircuitBreakerState,
} from "@auth/config";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";
import { compileTemplate, initializeTemplates } from "./template-engine.js";
import {
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  type EmailServiceOptions,
  type EmailServiceConfig,
  type IProviderService,
  type SendEmailParams,
  type EmailUser,
  type CircuitBreakerStats,
  type CircuitBreakerHealth,
  type EmailServiceHealth,
  type ICircuitBreaker,
  type MailOptions,
  type EmailResult,
  type SendOptions,
  type ProvidersHealthResult,
} from "./types.js";

/**
 * Email Service
 * Production-grade email service with circuit breaker, provider failover, and delivery tracking.
 */
class EmailService {
  private readonly config: EmailServiceConfig;
  private readonly logger: ILogger;
  private readonly emailLogRepository: IEmailLogRepository;
  private readonly providerService: IProviderService;
  private readonly circuitBreakerOptions: {
    readonly timeout: number;
    readonly errorThresholdPercentage: number;
    readonly resetTimeout: number;
    readonly rollingCountTimeout: number;
    readonly rollingCountBuckets: number;
    readonly volumeThreshold: number;
    readonly capacity: number;
    readonly name: string;
  };
  private emailBreaker: ICircuitBreaker<EmailResult> | null = null;
  private readonly circuitBreakerStats: CircuitBreakerStats;

  constructor(options: EmailServiceOptions) {
    if (options.config === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "config")
      );
    }
    if (options.logger === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "logger")
      );
    }
    if (options.emailLogRepository === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "emailLogRepository")
      );
    }
    if (options.providerService === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_CONFIG.replace("{config}", "providerService")
      );
    }

    this.config = options.config;
    this.logger = options.logger.child({ module: "email-service" });
    this.emailLogRepository = options.emailLogRepository;
    this.providerService = options.providerService;

    // Circuit breaker configuration (uses defaults with optional overrides)
    this.circuitBreakerOptions = {
      timeout: options.circuitBreakerTimeout ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.timeout,
      errorThresholdPercentage: options.circuitBreakerErrorThreshold ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.errorThresholdPercentage,
      resetTimeout: options.circuitBreakerResetTimeout ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.resetTimeout,
      rollingCountTimeout: DEFAULT_CIRCUIT_BREAKER_CONFIG.rollingCountTimeout,
      rollingCountBuckets: DEFAULT_CIRCUIT_BREAKER_CONFIG.rollingCountBuckets,
      volumeThreshold: options.circuitBreakerVolumeThreshold ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.volumeThreshold,
      capacity: options.circuitBreakerCapacity ?? DEFAULT_CIRCUIT_BREAKER_CONFIG.capacity,
      name: "emailCircuitBreaker",
    };

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
  async initialize(): Promise<void> {
    // Initialize templates
    await initializeTemplates({ logger: this.logger });

    // Initialize providers
    await this.providerService.initialize();

    // Create circuit breaker using shared utility
    const breaker = createCircuitBreaker(
      async (mailOptions: MailOptions, options?: SendOptions) => {
        return await this.providerService.sendWithFailover(mailOptions, options);
      },
      this.circuitBreakerOptions
    ) as unknown as ICircuitBreaker<EmailResult>;

    this.emailBreaker = breaker;

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
  private setupCircuitBreakerEvents(): void {
    if (!this.emailBreaker) return;

    this.emailBreaker.on("open", () => {
      this.circuitBreakerStats.circuitOpenTimestamp = Date.now();
      this.circuitBreakerStats.lastStateChange = new Date().toISOString();

      emailCircuitBreakerState.add(1, { event: "open" });

      this.logger.warn(
        {
          event: "circuit_breaker_open",
          state: "open",
          stats: {
            totalFires: this.circuitBreakerStats.totalFires,
            totalFailures: this.circuitBreakerStats.totalFailures,
            failureRate: this.calculateFailureRate(),
          },
        },
        EMAIL_MESSAGES.CB_OPEN
      );
    });

    this.emailBreaker.on("halfOpen", () => {
      const openDuration = this.circuitBreakerStats.circuitOpenTimestamp !== null
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
      const totalOpenDuration = this.circuitBreakerStats.circuitOpenTimestamp !== null
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
            successRate: this.calculateSuccessRate(),
          },
        },
        EMAIL_MESSAGES.CB_CLOSED
      );
    });

    this.emailBreaker.on("success", (result: unknown) => {
      this.circuitBreakerStats.totalSuccesses++;
      this.circuitBreakerStats.totalFires++;

      const emailResult = result as EmailResult | undefined;
      this.logger.debug(
        {
          event: "circuit_breaker_success",
          messageId: emailResult?.messageId,
          totalSuccesses: this.circuitBreakerStats.totalSuccesses,
        },
        EMAIL_MESSAGES.CB_SUCCESS
      );
    });

    this.emailBreaker.on("failure", (error: unknown) => {
      this.circuitBreakerStats.totalFailures++;
      this.circuitBreakerStats.totalFires++;

      const err = error as Error;
      this.logger.error(
        {
          event: "circuit_breaker_failure",
          error: err.message,
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
          timeoutMs: this.circuitBreakerOptions.timeout,
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

  private calculateFailureRate(): string {
    if (this.circuitBreakerStats.totalFires === 0) return "0%";
    return (
      (
        (this.circuitBreakerStats.totalFailures /
          this.circuitBreakerStats.totalFires) *
        100
      ).toFixed(2) + "%"
    );
  }

  private calculateSuccessRate(): string {
    if (this.circuitBreakerStats.totalFires === 0) return "0%";
    return (
      (
        (this.circuitBreakerStats.totalSuccesses /
          this.circuitBreakerStats.totalFires) *
        100
      ).toFixed(2) + "%"
    );
  }

  /**
   * Send email with delivery tracking
   */
  async sendEmail(params: SendEmailParams): Promise<EmailResult & { emailLogId?: string | undefined }> {
    const { to, subject, html, text, template, data, userId, type = "notification", metadata = {}, options = {} } = params;

    return withSpan(
      "email-service.send-email",
      async () => {
        addSpanAttributes({
          // ... existing attributes ...
          "email.type": type,
          "email.recipient_hash": hashSensitiveData(to),
          "user.id": userId ?? "anonymous",
          "email.options_present": Object.keys(options).length > 0,
          "email.template": template ?? "none",
        });

        let finalHtml = html;
        let finalSubject = subject;
        const finalText = text;

        // Compile template if provided
        if (template !== undefined && data !== undefined) {
          try {
            const templateData = { ...data, ...(subject !== undefined ? { subject } : {}) };
            finalHtml = await compileTemplate(template, templateData);

            // Try to extract subject from data if not provided
            if ((finalSubject === undefined || finalSubject === "") && data !== undefined && typeof (data as Record<string, unknown>)["subject"] === "string") {
              finalSubject = (data as Record<string, unknown>)["subject"] as string;
            }
          } catch (error) {
            this.logger.error({ err: error, template }, EMAIL_ERRORS.TEMPLATE_COMPILE_FAILED);
            throw error;
          }
        }

        if (finalHtml === undefined || finalHtml === "") {
          throw new Error("Email must have HTML content or a valid template");
        }
        if (finalSubject === undefined || finalSubject === "") {
          throw new Error("Email must have a subject");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultSubject = (this.config as any).email?.defaults?.subject as string | undefined;
        if ((finalSubject === undefined || finalSubject === "") && defaultSubject !== undefined && defaultSubject !== "") {
          finalSubject = defaultSubject;
        }
        const mailOptions: MailOptions = {
          from: this.config.emailFrom,
          to,
          subject: finalSubject,
          html: finalHtml,
          text: finalText ?? "",
        };

        // Create email log entry
        let emailLog: { _id: string } | undefined;
        try {
          const logData = {
            ...(userId !== undefined ? { userId } : {}),
            type,
            to,
            subject: finalSubject,
            status: "queued" as const,
            metadata: {
              ...metadata,
              ...(finalHtml !== undefined ? { html: finalHtml } : {}),
              ...(finalText !== undefined ? { text: finalText } : {}),
              ...(options.preferredProvider !== undefined ? { preferredProvider: options.preferredProvider } : {}),
            },
          };

          emailLog = await this.emailLogRepository.create(logData);

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
          if (!this.emailBreaker) {
            throw new Error("Email service not initialized");
          }

          const info = await this.emailBreaker.fire(mailOptions, options);
          const duration = Date.now() - startTime;

          addSpanAttributes({
            "email.provider": info.provider,
            "email.status": "sent",
            "email.message_id": info.messageId ?? "unknown",
            "email.duration_ms": duration,
          });

          emailSendTotal.add(1, {
            type,
            provider: info.provider,
            status: "sent",
          });
          emailSendDuration.record(duration / 1000, {
            type,
            provider: info.provider,
          });

          // Update log with success
          if (emailLog) {
            try {
              await this.emailLogRepository.updateStatus(emailLog._id, "sent", {
                messageId: info.messageId,
                provider: info.provider,
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
          const err = error as Error;

          addSpanAttributes({
            "email.status": "failed",
            "email.error": err.message,
            "email.duration_ms": duration,
          });

          emailSendTotal.add(1, {
            type,
            provider: "unknown",
            status: "failed",
          });
          emailSendDuration.record(duration / 1000, {
            type,
            provider: "unknown",
          });

          // Update log with failure
          if (emailLog) {
            try {
              await this.emailLogRepository.updateById(emailLog._id, {
                status: "failed",
                error: err.message,
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
              mailOptions,
              durationMs: duration,
              emailLogId: emailLog?._id,
            },
            EMAIL_ERRORS.DISPATCH_FAILED
          );
          throw new EmailDispatchError(EMAIL_ERRORS.DISPATCH_FAILED, err);
        }
      },
      { tracerName: "email-service", component: "email" }
    );
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    user: EmailUser,
    token: string,
    locale = "en",
    options: SendOptions = {}
  ): Promise<EmailResult & { emailLogId?: string | undefined }> {
    return withSpan(
      "email-service.send-verification",
      async () => {
        addSpanAttributes({
          "email.type": "verification",
          "user.id": user.id,
          "user.email_hash": hashSensitiveData(user.email),
          "email.locale": locale,
        });

        const verificationLogger = this.logger.child({
          module: "email-verification",
        });

        const t = await i18nInstance.getFixedT(locale);

        verificationLogger.debug(
          { userId: user.id, email: user.email },
          EMAIL_MESSAGES.PREPARING_VERIFICATION
        );

        const verificationUrl = `${this.config.clientUrl}/verify-email?token=${token}`;
        const expiryMinutes = this.config.verificationTokenExpiresIn / 60;

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
          options,
        });
      },
      { tracerName: "email-service", component: "email" }
    );
  }

  /**
   * Get circuit breaker health
   */
  getCircuitBreakerHealth(): CircuitBreakerHealth {
    if (!this.emailBreaker) {
      return {
        initialized: false,
        state: "unknown",
      };
    }

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
        successRate: this.calculateSuccessRate(),
        lastStateChange: this.circuitBreakerStats.lastStateChange,
      },
      circuitBreakerStats: this.emailBreaker.stats,
    };
  }

  /**
   * Get provider health
   */
  async getProviderHealth(): Promise<ProvidersHealthResult> {
    return await this.providerService.getHealth();
  }

  /**
   * Get overall health
   */
  async getHealth(): Promise<EmailServiceHealth> {
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
