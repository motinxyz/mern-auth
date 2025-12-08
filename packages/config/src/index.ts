// Import dependencies first
import { getLogger } from "./logger.js";
import { RedisService } from "./redis.js";
import config from "./env.js";

// Export configuration and utilities
export { default as config } from "./env.js";
export { getLogger } from "./logger.js";
export { i18nInstance, i18nMiddleware, initI18n, t } from "./i18n.js";
export { RedisService, type ExtendedRedis } from "./redis.js";
export * from "./constants/queue.js";
export { FeatureFlagService } from "./feature-flags.js";
export * from "./observability/index.js";

// Instantiate and export Redis connection
// Note: Uses getLogger() internally, but doesn't export logger singleton
// All consumers should use getLogger() for flexibility
const logger = getLogger();
const redisService = new RedisService({ config, logger });
export const redisConnection = redisService.connect();
