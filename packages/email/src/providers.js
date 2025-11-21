import { createTransport } from "nodemailer";
import { config, logger } from "@auth/config";

const providerLogger = logger.child({ module: "email-providers" });

export const providers = [];

// Primary provider
if (config.smtp?.host) {
  providers.push({
    name: "primary",
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
    { provider: "primary", host: config.smtp.host },
    "Primary email provider configured"
  );
}

// Fallback provider (if configured)
if (config.smtp?.fallback?.host) {
  providers.push({
    name: "fallback",
    transport: createTransport({
      pool: true,
      host: config.smtp.fallback.host,
      port: config.smtp.fallback.port,
      secure: config.smtp.fallback.port === 465,
      auth: {
        user: config.smtp.fallback.user,
        pass: config.smtp.fallback.pass,
      },
    }),
  });
  providerLogger.info(
    { provider: "fallback", host: config.smtp.fallback.host },
    "Fallback email provider configured"
  );
}

/**
 * Send email with automatic provider failover
 * @param {object} mailOptions - Nodemailer mail options
 * @returns {Promise<object>} - Send result with provider name
 */
export async function sendWithFailover(mailOptions) {
  if (providers.length === 0) {
    throw new Error("No email providers configured");
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

  throw new Error(`All email providers failed: ${lastError.message}`);
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
