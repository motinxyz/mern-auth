export { default as config, TOKEN_REDIS_PREFIXES, AUTH_REDIS_PREFIXES } from "./env.js";
export { default as logger } from "./logger.js";
import { i18nInstance } from "./i18n.js";
export { i18nInstance, i18nMiddleware } from "./i18n.js";
export const t = i18nInstance.t.bind(i18nInstance);
export { redisConnection } from "./redis.js";
