import { createTransport } from "nodemailer";
import { Resend } from "resend";
import { config, logger, t as systemT } from "@auth/config";
import { EmailDispatchError } from "@auth/utils";

const providerLogger = logger.child({ module: "email-providers" });

export const providers = [];

// Primary provider (Resend API)
if (config.resendApiKey) {
  const resend = new Resend(config.resendApiKey);

  // Retry configuration for Resend API
  const RESEND_MAX_RETRIES = 3;
  const RESEND_RETRY_DELAY_MS = 1000;
  const RESEND_TIMEOUT_MS = 30000;

  /**
   * Retry helper with exponential backoff
   */
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
        providerLogger.warn(
          {
            provider: "resend-api",
            attempt,
            maxRetries: retries,
            delayMs: delay,
            error: error.message,
          },
          systemT("email:logs.resendRetrying")
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  /**
   * Timeout wrapper for API calls
   */
  const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new EmailDispatchError(systemT("email:errors.resendTimeout"))
            ),
          timeoutMs
        )
      ),
    ]);
  };

  providers.push({
    name: "resend-api",
    transport: {
      // Adapter to match Nodemailer interface with retry and timeout
      sendMail: async (mailOptions) => {
        const { from, to, subject, html, text } = mailOptions;
        const startTime = Date.now();

        try {
          const data = await retryWithBackoff(async () => {
            return await withTimeout(
              resend.emails.send({
                from,
                to,
                subject,
                html,
                text,
              }),
              RESEND_TIMEOUT_MS
            );
          });

          const duration = Date.now() - startTime;

          if (data.error) {
            providerLogger.error(
              {
                provider: "resend-api",
                error: data.error,
                to,
                subject,
                durationMs: duration,
              },
              systemT("email:errors.resendApiError")
            );
            throw new EmailDispatchError(
              systemT("email:errors.resendApiError"),
              data.error
            );
          }

          providerLogger.debug(
            {
              provider: "resend-api",
              messageId: data.data.id,
              to,
              durationMs: duration,
            },
            systemT("email:logs.resendSent")
          );

          return { messageId: data.data.id, provider: "resend-api" };
        } catch (error) {
          const duration = Date.now() - startTime;
          providerLogger.error(
            {
              provider: "resend-api",
              error: error.message,
              to,
              subject,
              durationMs: duration,
            },
            systemT("email:errors.resendFailed")
          );

          // Re-throw if already EmailDispatchError, otherwise wrap it
          if (error instanceof EmailDispatchError) {
            throw error;
          }
          throw new EmailDispatchError(
            systemT("email:errors.resendFailed"),
            error
          );
        }
      },
      verify: async () => {
        if (!config.resendApiKey) {
          throw new EmailDispatchError(
            systemT("email:errors.resendApiKeyMissing")
          );
        }
        // Resend doesn't have a dedicated health check endpoint
        // We verify by checking the API key format
        if (!/^re_[a-zA-Z0-9]{32}$/.test(config.resendApiKey)) {
          providerLogger.warn(systemT("email:errors.resendApiKeyInvalid"));
        }
        return true;
      },
    },
  });

  providerLogger.info(
    { provider: "resend-api" },
    "Resend API email provider configured"
  );
}

// Fallback provider (Gmail SMTP) - only if SMTP credentials are configured
if (config.smtp?.host && config.smtp?.user) {
  providers.push({
    name: "smtp-gmail-fallback",
    transport: createTransport({
      pool: true,
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    }),
  });

  providerLogger.info(
    { provider: "smtp-gmail-fallback", host: config.smtp.host },
    "Gmail SMTP fallback provider configured"
  );
}

/**
 * Send email with automatic provider failover
 * @param {object} mailOptions - Nodemailer mail options
 * @returns {Promise<object>} - Send result with provider name
 */
export async function sendWithFailover(mailOptions) {
  if (providers.length === 0) {
    throw new EmailDispatchError(systemT("email:errors.noProvidersConfigured"));
  }

  // If only one provider, use it directly
  if (providers.length === 1) {
    const info = await providers[0].transport.sendMail(mailOptions);
    return { ...info, provider: providers[0].name };
  }

  // Try each provider in order
  let lastError;

  for (const provider of providers) {
    try {
      providerLogger.debug(
        { provider: provider.name },
        "Attempting to send via provider"
      );
      const info = await provider.transport.sendMail(mailOptions);
      providerLogger.info(
        {
          provider: provider.name,
          messageId: info.messageId,
        },
        "Email sent via provider"
      );
      return { ...info, provider: provider.name };
    } catch (error) {
      lastError = error;
      providerLogger.warn(
        {
          provider: provider.name,
          error: error.message,
        },
        "Provider failed, trying next"
      );
    }
  }

  throw new EmailDispatchError(
    systemT("email:errors.allProvidersFailed"),
    lastError
  );
}

/**
 * Get provider health status
 * @returns {Promise<Array>} - Array of provider health statuses
 */
export async function getProviderHealth() {
  const healthChecks = await Promise.allSettled(
    providers.map(async (provider) => {
      try {
        await provider.transport.verify();
        return { name: provider.name, status: "healthy" };
      } catch (error) {
        return {
          name: provider.name,
          status: "unhealthy",
          error: error.message,
        };
      }
    })
  );

  return healthChecks.map((result) => result.value || result.reason);
}
