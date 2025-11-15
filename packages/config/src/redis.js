import Redis from "ioredis";
import config from "./env.js";
import { getLogger } from "./logger.js";
import { i18nInstance } from "./i18n.js";
import { RedisConnectionError } from "@auth/utils";

const logger = getLogger();

const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // BullMQ requires this to be null
  retryStrategy: (times) => {
    if (times > config.redisMaxRetries) {
      logger.error(t("system:redis.maxRetriesExceeded"));
      return null; // Stop retrying after max retries
    }
    const delay = Math.min(times * config.redisRetryDelayMs, 2000);
    return delay;
  },
});

const t = i18nInstance.t.bind(i18nInstance);

redisConnection.on("connect", () => {
  logger.info(t("system:redis.connected"));
});

redisConnection.on("error", (err) => {
  logger.error(t("system:redis.connectionError"), err);
  // The retryStrategy will handle reconnection attempts.
  // If it returns null, it means max retries exceeded and a 'close' event will follow.
});

redisConnection.on("close", () => {
  logger.info(t("system:redis.connectionClosed"));
  // If the connection closes after max retries, it's a critical error
  if (redisConnection.status === "end") {
    logger.fatal(t("system:redis.connectionFailedAfterRetries"));
    throw new RedisConnectionError(t("system:redis.connectionFailedAfterRetries"));
  }
});

export { redisConnection };
