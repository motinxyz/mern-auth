export { default as config } from "./env.js";
import { getLogger } from "./logger.js";
// import { i18nInstance } from "./i18n.js";
export { i18nInstance, i18nMiddleware, initI18n } from "./i18n.js";
export let t = (key, options) => key; // Default no-op t function
export const setT = (tFunction) => { t = tFunction; };
export { redisConnection } from "./redis.js";

export const logger = getLogger();
