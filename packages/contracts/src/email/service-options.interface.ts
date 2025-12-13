import type { IConfig } from "../core/config.interface.js";
import type { ILogger } from "../core/logger.interface.js";
import type { IEmailLogRepository } from "../repositories/email-log.repository.js";
import type { IProviderService } from "./provider-service.interface.js";

/**
 * Dependencies required to initialize an EmailService.
 */
export interface EmailServiceOptions {
    /** Application configuration */
    readonly config: IConfig;
    /** Logger instance for email operations */
    readonly logger: ILogger;
    /** Optional repository for logging email events */
    readonly emailLogRepository?: IEmailLogRepository | undefined;
    /** Optional provider service for multi-provider failover */
    readonly providerService?: IProviderService | undefined;
}
