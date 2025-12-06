/**
 * Feature Flag Service
 * Enables/disables features dynamically using Redis
 */
export declare class FeatureFlagService {
    redis: any;
    logger: any;
    constructor({ redis, logger }: {
        redis: any;
        logger: any;
    });
    /**
     * Check if a feature is enabled
     * @param {string} flagName - Feature flag name
     * @param {string} userId - Optional user ID for user-specific flags
     * @returns {Promise<boolean>}
     */
    isEnabled(flagName: any, userId?: any): Promise<boolean>;
    /**
     * Enable a feature globally
     * @param {string} flagName - Feature flag name
     */
    enable(flagName: any): Promise<void>;
    /**
     * Disable a feature globally
     * @param {string} flagName - Feature flag name
     */
    disable(flagName: any): Promise<void>;
    /**
     * Enable a feature for a specific user
     * @param {string} flagName - Feature flag name
     * @param {string} userId - User ID
     */
    enableForUser(flagName: any, userId: any): Promise<void>;
    /**
     * Set percentage rollout for a feature
     * @param {string} flagName - Feature flag name
     * @param {number} percentage - Percentage of users (0-100)
     */
    setRolloutPercentage(flagName: any, percentage: any): Promise<void>;
    /**
     * Hash user ID to determine rollout eligibility
     * @param {string} userId - User ID
     * @returns {number} Hash value between 0-100
     */
    hashUserId(userId: any): number;
    /**
     * Get all feature flags
     * @returns {Promise<Object>} Map of flag names to their status
     */
    getAllFlags(): Promise<{}>;
}
//# sourceMappingURL=feature-flags.d.ts.map