import Redis from "ioredis";
import config from "../config/env.js";
import { RedisConnectionError } from "../errors/index.js";
import logger, { t as systemT } from "../config/system-logger.js";

const redisLogger = logger.child({ module: "redis" });

// ioredis has a more robust connection handling and is the recommended client for BullMQ.
// It automatically handles reconnections and provides a more stable experience.
const client = new Redis(config.redisUrl, {
  // Add a ready check to ensure the client is connected before processing commands
  enableReadyCheck: true,
  // BullMQ requires this setting to be null.
  // It handles its own command retry logic and does not want ioredis to interfere.
  // See: https://docs.bullmq.io/guide/connections
  maxRetriesPerRequest: null,
});

client.on("connect", () => {
  redisLogger.info(systemT("system:redis.connectSuccess"));
});

client.on("error", (err) => {
  // Log the specific Redis client error with a translated message for high-level context.
  redisLogger.error({ err }, systemT("system:redis.connectError"));

  // Throw a structured, non-translated error containing the original error.
  // This is a critical failure, and the process should exit to be restarted by PM2.
  throw new RedisConnectionError(err);
});

// No need for an explicit connect function, ioredis handles it.

export default client;