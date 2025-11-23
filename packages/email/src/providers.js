import { createTransport } from "nodemailer";
import { Resend } from "resend";
import { config, logger } from "@auth/config";

const providerLogger = logger.child({ module: "email-providers" });

export const providers = [];

// Primary provider (Resend API)
if (config.resendApiKey) {
  const resend = new Resend(config.resendApiKey);

  providers.push({
    name: "resend-api",
    transport: {
      // Adapter to match Nodemailer interface
      sendMail: async (mailOptions) => {
        const { from, to, subject, html, text } = mailOptions;
        const data = await resend.emails.send({
          from,
          to,
          subject,
          html,
          text,
        });

        if (data.error) {
          throw new Error(data.error.message);
        }

        return { messageId: data.data.id };
      },
      verify: async () => {
        // Simple verification by checking if client is initialized
        // In a real scenario, we might try to fetch a dummy resource or check account status
        // For now, existence of API key is enough validation for startup
        if (!config.resendApiKey) throw new Error("Missing Resend API Key");
        return true;
      },
    },
  });

  providerLogger.info(
    { provider: "resend-api" },
    "Resend API email provider configured"
  );
} else if (config.smtp?.host) {
  // Fallback to SMTP if Resend API key is not present
  providers.push({
    name: "smtp-primary",
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
    { provider: "smtp-primary", host: config.smtp.host },
    "Primary SMTP email provider configured"
  );
}

// Fallback provider (SMTP)
if (config.smtp?.fallback?.host) {
  providers.push({
    name: "smtp-fallback",
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
    { provider: "smtp-fallback", host: config.smtp.fallback.host },
    "Fallback SMTP email provider configured"
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
