import type { ILogger, IRedisConnection } from "@auth/contracts";
export declare class FeatureFlagService {
    private readonly redis;
    private readonly logger;
    constructor({ redis, logger }: {
        redis: IRedisConnection;
        logger: ILogger;
    });
    /**
     * Check if a feature is enabled
     */
    isEnabled(flagName: string, userId?: string | null): Promise<boolean>;
    /**
     * Enable a feature globally
     */
    enable(flagName: string): Promise<void>;
    /**
     * Disable a feature globally
     */
    disable(flagName: string): Promise<void>;
    /**
     * Enable a feature for a specific user
     */
    enableForUser(flagName: string, userId: string): Promise<void>;
    /**
     * Set percentage rollout for a feature
     */
    setRolloutPercentage(flagName: string, percentage: number): Promise<void>;
    /**
     * Hash user ID to determine rollout eligibility
     */
    private hashUserId;
    /**
     * Get all feature flags
     */
    getAllFlags(): Promise<Record<string, boolean>>;
}
//# sourceMappingURL=feature-flags.d.ts.map