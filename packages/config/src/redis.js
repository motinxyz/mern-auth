import { Redis } from "ioredis";
import config from "./env.js";
import logger from "./logger.js";

const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  logger.info("Redis connected");
});

redisConnection.on("error", (err) => {
  logger.error("Redis connection error:", err);
  // In a real app, you might want a more graceful shutdown or retry mechanism
  process.exit(1);
});

export { redisConnection };
