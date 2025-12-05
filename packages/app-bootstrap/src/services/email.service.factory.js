import { EmailService, ProviderService } from "@auth/email";
import { config, getLogger } from "@auth/config";

/**
 * Email Service Factory
 * Creates and configures the EmailService instance
 *
 * @param {Object} databaseService - DatabaseService instance
 */
export function createEmailService(databaseService) {
  const logger = getLogger();

  const providerService = new ProviderService({
    config,
    logger,
  });

  return new EmailService({
    config,
    logger,
    emailLogRepository: databaseService.emailLogs,
    providerService,
  });
}
