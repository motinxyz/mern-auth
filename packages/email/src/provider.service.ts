import {
  EmailDispatchError,
  ConfigurationError,
} from "@auth/utils";
import {
  withSpan,
  addSpanAttributes,
} from "@auth/observability";
import type { ILogger } from "@auth/contracts";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";
import ResendProvider from "./providers/resend.provider.js";
import MailerSendProvider from "./providers/mailersend.provider.js";
import type {
  IProviderService,
  IEmailProvider,
  ProviderServiceOptions,
  ProviderConfig,
  MailOptions,
  EmailResult,
  SendOptions,
  ProvidersHealthResult,
  ProviderHealth,
} from "./types.js";

/**
 * Provider Service
 * Manages email providers (Resend, MailerSend) with failover support.
 * Implements IProviderService interface.
 */
class ProviderService implements IProviderService {
  private readonly config: ProviderConfig;
  private readonly logger: ILogger;
  private readonly providers: IEmailProvider[] = [];

  constructor(options: ProviderServiceOptions) {
    if (options.config === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "config")
      );
    }
    if (options.logger === undefined) {
      throw new ConfigurationError(
        EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "logger")
      );
    }
    this.config = options.config;
    this.logger = options.logger.child({ module: "email-providers" });
  }

  /**
   * Initialize providers
   */
  async initialize(): Promise<void> {
    // Initialize Resend API if configured (PRIMARY)
    if (this.config.resendApiKey !== undefined && this.config.resendApiKey !== "") {
      const resendProvider = new ResendProvider({
        apiKey: this.config.resendApiKey,
        webhookSecret: this.config.resendWebhookSecret,
        logger: this.logger,
      });
      this.providers.push(resendProvider);
      this.logger.info(EMAIL_MESSAGES.RESEND_INITIALIZED);
    }

    // Initialize MailerSend if configured (BACKUP)
    if (this.config.mailersendApiKey !== undefined && this.config.mailersendApiKey !== "") {
      const mailersendProvider = new MailerSendProvider({
        apiKey: this.config.mailersendApiKey,
        webhookSecret: this.config.mailersendWebhookSecret,
        fromEmail: this.config.mailersendEmailFrom,
        logger: this.logger,
      });
      this.providers.push(mailersendProvider);
      this.logger.info(EMAIL_MESSAGES.MAILERSEND_INITIALIZED);
    }

    if (this.providers.length === 0) {
      throw new ConfigurationError(EMAIL_ERRORS.NO_PROVIDERS);
    }

    this.logger.info(
      EMAIL_MESSAGES.PROVIDERS_INITIALIZED.replace(
        "{count}",
        String(this.providers.length)
      ).replace("{providers}", this.providers.map((p) => p.name).join(", "))
    );
  }

  /**
   * Send email with failover
   */
  async sendWithFailover(
    mailOptions: MailOptions,
    options: SendOptions = {}
  ): Promise<EmailResult> {
    return withSpan("ProviderService.sendWithFailover", async () => {
      addSpanAttributes({
        "email.to_hash": mailOptions.to.substring(0, 3) + "***",
        "email.preferred_provider": options.preferredProvider ?? "none",
      });

      const errors: Array<{ provider: string; error: Error }> = [];
      let providersToTry = [...this.providers];

      // If preferred provider is specified, prioritize it
      if (options.preferredProvider !== undefined && options.preferredProvider !== "") {
        const preferred = providersToTry.find(
          (p) => p.name === options.preferredProvider
        );
        if (preferred) {
          providersToTry = [
            preferred,
            ...providersToTry.filter((p) => p.name !== options.preferredProvider),
          ];
        } else {
          this.logger.warn(
            { preferredProvider: options.preferredProvider },
            "Preferred provider not found, using default order"
          );
        }
      }

      for (const provider of providersToTry) {
        try {
          this.logger.debug(
            { provider: provider.name, to: mailOptions.to },
            EMAIL_MESSAGES.PROVIDER_ATTEMPT.replace("{provider}", provider.name)
          );

          // Individual span for each provider attempt
          const result = await withSpan(
            `email.provider.${provider.name}`,
            async () => {
              addSpanAttributes({
                "email.provider.name": provider.name,
                "email.provider.attempt": true,
              });

              const sendResult = await provider.send(mailOptions);

              addSpanAttributes({
                "email.message_id": sendResult.messageId ?? "unknown",
                "email.provider.success": true,
              });

              return sendResult;
            }
          );

          addSpanAttributes({
            "email.provider": provider.name,
            "email.message_id": result.messageId ?? "unknown",
            "email.success": true,
          });

          this.logger.info(
            { provider: provider.name, messageId: result.messageId },
            EMAIL_MESSAGES.PROVIDER_SUCCESS.replace("{provider}", provider.name)
          );

          return result;
        } catch (error) {
          const err = error as Error;
          errors.push({ provider: provider.name, error: err });

          addSpanAttributes({
            [`email.provider.${provider.name}.failed`]: true,
            [`email.provider.${provider.name}.error`]: err.message,
          });

          this.logger.warn(
            { provider: provider.name, error: err.message },
            EMAIL_MESSAGES.PROVIDER_FAILOVER.replace("{provider}", provider.name)
          );
        }
      }

      // All providers failed
      const errorDetails = errors
        .map((e) => `${e.provider}: ${e.error.message}`)
        .join("; ");
      throw new EmailDispatchError(
        EMAIL_ERRORS.ALL_PROVIDERS_FAILED.replace("{details}", errorDetails),
        new Error(JSON.stringify(errors))
      );
    });
  }

  /**
   * Get provider health
   */
  async getHealth(): Promise<ProvidersHealthResult> {
    const providerResults: ProviderHealth[] = [];
    let overallHealthy = true;

    for (const provider of this.providers) {
      try {
        const result = await provider.checkHealth();
        providerResults.push({
          name: provider.name,
          healthy: result.healthy,
          error: result.error,
        });
        if (!result.healthy) overallHealthy = false;
      } catch (error) {
        const err = error as Error;
        overallHealthy = false;
        providerResults.push({
          name: provider.name,
          healthy: false,
          error: err.message,
        });
      }
    }

    return {
      healthy: overallHealthy,
      providers: providerResults,
    };
  }

  /**
   * Get all providers
   */
  getProviders(): readonly IEmailProvider[] {
    return this.providers;
  }
}

export default ProviderService;
