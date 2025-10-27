import Redis from "ioredis";
import config from "../config/env.js";
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
  redisLogger.info(systemT("common:system.redisConnected"));
});

client.on("error", (err) => {
  redisLogger.error({ err }, systemT("common:system.redisClientError"));
});

// No need for an explicit connect function, ioredis handles it.

export default client;