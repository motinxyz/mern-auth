
import { Redis } from "ioredis";
import config from "../config/env.js";
import logger from "../../config/logger.js";

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  logger.info("Redis connected");
});

connection.on("error", (err) => {
  logger.error("Redis connection error:", err);
  process.exit(1);
});

export default connection;
