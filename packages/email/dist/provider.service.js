import { EmailDispatchError, ConfigurationError, withSpan, addSpanAttributes, } from "@auth/utils";
import { EMAIL_MESSAGES, EMAIL_ERRORS } from "./constants/email.messages.js";
import ResendProvider from "./providers/resend.provider.js";
import MailerSendProvider from "./providers/mailersend.provider.js";
/**
 * Provider Service
 * Manages email providers (Resend, MailerSend) with failover support
 */
class ProviderService {
    config;
    logger;
    providers;
    constructor(options = {}) {
        if (!options.config) {
            throw new ConfigurationError(EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "config"));
        }
        if (!options.logger) {
            throw new ConfigurationError(EMAIL_ERRORS.MISSING_PROVIDER_CONFIG.replace("{config}", "logger"));
        }
        this.config = options.config;
        this.logger = options.logger.child({ module: "email-providers" });
        this.providers = [];
    }
    /**
     * Initialize providers
     */
    async initialize() {
        // Initialize Resend API if configured (PRIMARY)
        if (this.config.resendApiKey) {
            const resendProvider = new ResendProvider({
                apiKey: this.config.resendApiKey,
                webhookSecret: this.config.resendWebhookSecret,
                logger: this.logger,
            });
            this.providers.push(resendProvider);
            this.logger.info(EMAIL_MESSAGES.RESEND_INITIALIZED);
        }
        // Initialize MailerSend if configured (BACKUP)
        if (this.config.mailersendApiKey) {
            const mailersendProvider = new MailerSendProvider({
                apiKey: this.config.mailersendApiKey,
                webhookSecret: this.config.mailersendWebhookSecret,
                fromEmail: this.config.mailersendEmailFrom,
                logger: this.logger,
            });
            this.providers.push(mailersendProvider);
            this.logger.info("MailerSend initialized");
        }
        if (this.providers.length === 0) {
            throw new ConfigurationError(EMAIL_ERRORS.NO_PROVIDERS);
        }
        this.logger.info(EMAIL_MESSAGES.PROVIDERS_INITIALIZED.replace("{count}", String(this.providers.length)).replace("{providers}", this.providers.map((p) => p.name).join(", ")));
    }
    /**
     * Send email with failover
     * @param {object} mailOptions - Email options (to, from, subject, html, text)
     * @param {object} options - Send options
     * @param {string} options.preferredProvider - Name of provider to try first/only
     */
    async sendWithFailover(mailOptions, options = {}) {
        return withSpan("ProviderService.sendWithFailover", async () => {
            addSpanAttributes({
                "email.to_hash": mailOptions.to?.substring(0, 3) + "***",
                "email.preferred_provider": options.preferredProvider || "none",
            });
            const errors = [];
            let providersToTry = [...this.providers];
            // If preferred provider is specified, prioritize it
            if (options.preferredProvider) {
                const preferred = providersToTry.find((p) => p.name === options.preferredProvider);
                if (preferred) {
                    // Move preferred to front
                    providersToTry = [
                        preferred,
                        ...providersToTry.filter((p) => p.name !== options.preferredProvider),
                    ];
                }
                else {
                    this.logger.warn({ preferredProvider: options.preferredProvider }, "Preferred provider not found, using default order");
                }
            }
            for (const provider of providersToTry) {
                try {
                    // Verify provider logic...
                    this.logger.debug({ provider: provider.name, to: mailOptions.to }, EMAIL_MESSAGES.PROVIDER_ATTEMPT.replace("{provider}", provider.name));
                    const result = await provider.send(mailOptions);
                    addSpanAttributes({
                        "email.provider": provider.name,
                        "email.message_id": result.messageId,
                    });
                    this.logger.info({ provider: provider.name, messageId: result.messageId }, EMAIL_MESSAGES.PROVIDER_SUCCESS.replace("{provider}", provider.name));
                    return result;
                }
                catch (error) {
                    errors.push({ provider: provider.name, error });
                    this.logger.warn({ provider: provider.name, error: error.message }, EMAIL_MESSAGES.PROVIDER_FAILOVER.replace("{provider}", provider.name));
                }
            }
            // All providers failed
            const errorDetails = errors
                .map((e) => `${e.provider}: ${e.error.message}`)
                .join("; ");
            throw new EmailDispatchError(EMAIL_ERRORS.ALL_PROVIDERS_FAILED.replace("{details}", errorDetails), new Error(JSON.stringify(errors)));
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
                const result = await provider.checkHealth();
                health.providers.push({
                    name: provider.name,
                    healthy: result.healthy,
                    error: result.error,
                });
                if (!result.healthy)
                    health.healthy = false;
            }
            catch (error) {
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
//# sourceMappingURL=provider.service.js.map