/**
 * Feature Flag Service
 * Enables/disables features dynamically using Redis
 */
import { ConfigurationError } from "@auth/utils";
import { CONFIG_MESSAGES, CONFIG_ERRORS } from "./constants/config.messages.js";
export class FeatureFlagService {
    redis;
    logger;
    constructor({ redis, logger }) {
        if (redis === undefined || redis === null) {
            throw new ConfigurationError(CONFIG_ERRORS.FF_REDIS_REQUIRED);
        }
        if (logger === undefined || logger === null) {
            throw new ConfigurationError(CONFIG_ERRORS.FF_LOGGER_REQUIRED);
        }
        this.redis = redis;
        this.logger = logger.child({ module: "feature-flags" });
    }
    /**
     * Check if a feature is enabled
     */
    async isEnabled(flagName, userId = null) {
        try {
            // Check global flag first
            const globalFlag = await this.redis.get(`flag:${flagName}`);
            if (globalFlag === "true") {
                return true;
            }
            if (globalFlag === "false") {
                return false;
            }
            // Check user-specific flag
            if (userId !== null) {
                const userFlag = await this.redis.get(`flag:${flagName}:user:${userId}`);
                if (userFlag === "true") {
                    return true;
                }
            }
            // Check percentage rollout
            if (userId !== null) {
                const rolloutPercentage = await this.redis.get(`flag:${flagName}:rollout`);
                if (rolloutPercentage !== null && rolloutPercentage !== "") {
                    const percentage = parseInt(rolloutPercentage, 10);
                    const userHash = this.hashUserId(userId);
                    return userHash < percentage;
                }
            }
            // Default to disabled
            return false;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage, flagName, userId }, CONFIG_ERRORS.FF_CHECK_ERROR);
            // Fail open - if Redis is down, allow the feature
            return true;
        }
    }
    /**
     * Enable a feature globally
     */
    async enable(flagName) {
        try {
            await this.redis.set(`flag:${flagName}`, "true");
            this.logger.info({ flagName }, CONFIG_MESSAGES.FF_ENABLED);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage, flagName }, CONFIG_ERRORS.FF_ENABLE_FAILED);
            throw error;
        }
    }
    /**
     * Disable a feature globally
     */
    async disable(flagName) {
        try {
            await this.redis.set(`flag:${flagName}`, "false");
            this.logger.info({ flagName }, CONFIG_MESSAGES.FF_DISABLED);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage, flagName }, CONFIG_ERRORS.FF_DISABLE_FAILED);
            throw error;
        }
    }
    /**
     * Enable a feature for a specific user
     */
    async enableForUser(flagName, userId) {
        try {
            await this.redis.set(`flag:${flagName}:user:${userId}`, "true");
            this.logger.info({ flagName, userId }, CONFIG_MESSAGES.FF_ENABLED_FOR_USER);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage, flagName, userId }, CONFIG_ERRORS.FF_ENABLE_USER_FAILED);
            throw error;
        }
    }
    /**
     * Set percentage rollout for a feature
     */
    async setRolloutPercentage(flagName, percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new Error(CONFIG_ERRORS.FF_PERCENTAGE_INVALID);
        }
        try {
            await this.redis.set(`flag:${flagName}:rollout`, percentage.toString());
            this.logger.info({ flagName, percentage }, CONFIG_MESSAGES.FF_ROLLOUT_SET);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage, flagName, percentage }, CONFIG_ERRORS.FF_ROLLOUT_FAILED);
            throw error;
        }
    }
    /**
     * Hash user ID to determine rollout eligibility
     */
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash) % 100;
    }
    /**
     * Get all feature flags
     */
    async getAllFlags() {
        try {
            const keys = await this.redis.keys("flag:*");
            const flags = {};
            for (const key of keys) {
                // Skip user-specific and rollout keys
                if (key.includes(":user:") || key.includes(":rollout")) {
                    continue;
                }
                const flagName = key.replace("flag:", "");
                const value = await this.redis.get(key);
                // eslint-disable-next-line security/detect-object-injection -- flagName is derived from controlled Redis keys
                flags[flagName] = value === "true";
            }
            return flags;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error({ err: errorMessage }, CONFIG_ERRORS.FF_GET_ALL_FAILED);
            return {};
        }
    }
}
//# sourceMappingURL=feature-flags.js.map