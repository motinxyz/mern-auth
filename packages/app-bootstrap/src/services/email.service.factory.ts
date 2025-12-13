import { EmailService, ProviderService, type EmailServiceConfig } from "@auth/email";
import { config } from "@auth/config";
import { getLogger } from "../bootstrap.js";
import { ConfigurationError } from "@auth/utils";
import type { IDatabaseService, IEmailService } from "@auth/contracts";

/**
 * Email Service Factory
 *
 * Creates and configures the EmailService instance.
 * Returns a fully typed IEmailService for contract compliance.
 *
 * @param databaseService - The initialized database service instance
 * @returns Configured email service implementing IEmailService
 * @throws ConfigurationError if emailFrom is missing in production
 */
export function createEmailService(databaseService: IDatabaseService): IEmailService {
  const logger = getLogger();

  // Validate critical config in production
  if (config.emailFrom === undefined && Boolean(config.isProduction)) {
    throw new ConfigurationError(
      "EMAIL_FROM is required in production environment"
    );
  }

  const providerService = new ProviderService({
    config,
    logger,
  });

  // Create typed email service config with validated values
  const emailConfig: EmailServiceConfig = {
    emailFrom: config.emailFrom ?? "noreply@localhost",
    clientUrl: config.clientUrl,
    verificationTokenExpiresIn: config.verificationTokenExpiresIn,
  };

  return new EmailService({
    config: emailConfig,
    logger,
    emailLogRepository: databaseService.emailLogRepository,
    providerService,
  });
}
