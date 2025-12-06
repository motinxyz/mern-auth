/**
 * Email Service
 * Production-grade email service with circuit breaker, provider failover, and delivery tracking
 */
declare class EmailService {
    config: any;
    logger: any;
    emailLogRepository: any;
    providerService: any;
    circuitBreakerOptions: any;
    emailBreaker: any;
    circuitBreakerStats: any;
    constructor(options?: any);
    /**
     * Initialize email service
     */
    initialize(): Promise<void>;
    /**
     * Setup circuit breaker event handlers
     */
    setupCircuitBreakerEvents(): void;
    /**
     * Send email with delivery tracking
     */
    sendEmail({ to, subject, html, text, userId, type, metadata, options, }: {
        to: any;
        subject: any;
        html: any;
        text: any;
        userId: any;
        type?: string;
        metadata?: {};
        options?: any;
    }): Promise<any>;
    /**
     * Send verification email
     * @param {object} user - User object containing email and name
     * @param {string} token - Verification token
     * @param {string} locale - User's locale
     * @param {object} options - Extra options (e.g. preferredProvider)
     * @returns {Promise<object>} - Result from sendEmail
     */
    sendVerificationEmail(user: any, token: any, locale?: string, options?: {}): Promise<any>;
    /**
     * Get circuit breaker health
     */
    getCircuitBreakerHealth(): {
        initialized: boolean;
        state: string;
        inMemoryStats?: undefined;
        circuitBreakerStats?: undefined;
    } | {
        initialized: boolean;
        state: string;
        inMemoryStats: {
            totalFires: any;
            totalSuccesses: any;
            totalFailures: any;
            totalTimeouts: any;
            totalRejects: any;
            successRate: string;
            lastStateChange: any;
        };
        circuitBreakerStats: {
            fires: any;
            successes: any;
            failures: any;
            rejects: any;
            timeouts: any;
            cacheHits: any;
            cacheMisses: any;
            semaphoreRejections: any;
            percentiles: any;
            latencyMean: any;
        };
    };
    /**
     * Get provider health
     */
    getProviderHealth(): Promise<any>;
    /**
     * Get overall health
     */
    getHealth(): Promise<{
        healthy: any;
        circuitBreaker: {
            initialized: boolean;
            state: string;
            inMemoryStats?: undefined;
            circuitBreakerStats?: undefined;
        } | {
            initialized: boolean;
            state: string;
            inMemoryStats: {
                totalFires: any;
                totalSuccesses: any;
                totalFailures: any;
                totalTimeouts: any;
                totalRejects: any;
                successRate: string;
                lastStateChange: any;
            };
            circuitBreakerStats: {
                fires: any;
                successes: any;
                failures: any;
                rejects: any;
                timeouts: any;
                cacheHits: any;
                cacheMisses: any;
                semaphoreRejections: any;
                percentiles: any;
                latencyMean: any;
            };
        };
        providers: any;
    }>;
}
export default EmailService;
//# sourceMappingURL=email.service.d.ts.map