import type { ILogger } from "@auth/contracts";
/**
 * Provider Service
 * Manages email providers (Resend, MailerSend) with failover support
 */
declare class ProviderService {
    config: any;
    logger: ILogger;
    providers: any[];
    constructor(options?: any);
    /**
     * Initialize providers
     */
    initialize(): Promise<void>;
    /**
     * Send email with failover
     * @param {object} mailOptions - Email options (to, from, subject, html, text)
     * @param {object} options - Send options
     * @param {string} options.preferredProvider - Name of provider to try first/only
     */
    sendWithFailover(mailOptions: any, options?: any): Promise<any>;
    /**
     * Get provider health
     */
    getHealth(): Promise<{
        healthy: boolean;
        providers: any[];
    }>;
    /**
     * Get all providers
     */
    getProviders(): any[];
}
export default ProviderService;
//# sourceMappingURL=provider.service.d.ts.map