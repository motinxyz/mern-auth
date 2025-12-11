/**
 * @auth/config - Configuration Package Entry Point
 *
 * This module provides centralized configuration and utilities for all packages.
 * Uses lazy initialization patterns to avoid side-effects on import.
 */

// Export configuration
export { default as config } from "./env.js";

// Export logger
export { getLogger } from "./logger.js";

// Export i18n utilities
export { i18nInstance, i18nMiddleware, initI18n, t } from "./i18n.js";

// Export Redis service and factory
export { RedisService, type ExtendedRedis } from "./redis.js";
export { getRedisConnection, resetRedisConnection } from "./redis.factory.js";

// Export queue constants
export * from "./constants/queue.js";

// Export feature flags
export { FeatureFlagService } from "./feature-flags.js";

