import Redis from "ioredis";
import config from "./env.js";
import logger from "./logger.js";
import { i18nInstance } from "./i18n.js";

const retryStrategy = (times) => {
  const delay = Math.min(times * 50, 2000);
  return delay;
};

const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy,
});

const t = i18nInstance.t.bind(i18nInstance);

redisConnection.on("connect", () => {
  logger.info(t("system:redis.connected"));
});

redisConnection.on("error", (err) => {
  logger.error(t("system:redis.connectionError"), err);
  // The retryStrategy will handle reconnection attempts. 
  // If it fails after all retries, ioredis will emit a 'close' event.
});

redisConnection.on("close", () => {
  logger.info(t("system:redis.connectionClosed"));
  // In a real app, a critical connection closure would typically trigger
  // a graceful shutdown of the entire application, handled by the main entry point.
});

export { redisConnection };
