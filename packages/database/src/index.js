import mongoose from "mongoose";
import { config } from "@auth/config";
import { logger, t } from "@auth/config";
import { ConfigurationError, DatabaseConnectionError } from "@auth/utils";

mongoose.connection.on("connected", () => {
  logger.info(t("system:db.connected"));
});

mongoose.connection.on("error", (err) => {
  logger.error(t("system:db.connectionError"), err);
  // In a real app, a critical connection error would typically trigger
  // a graceful shutdown of the entire application, handled by the main entry point.
});

mongoose.connection.on("disconnected", () => {
  logger.warn(t("system:db.disconnected"));
});

const connectDB = async () => {
  for (let i = 0; i < config.dbMaxRetries; i++) {
    // Use config.dbMaxRetries
    try {
      logger.debug({
        msg: t("system:db.attemptingConnection"),
        dbName: config.dbName,
        attempt: i + 1,
        maxAttempts: config.dbMaxRetries, // Use config.dbMaxRetries
      });

      await mongoose.connect(config.dbURI, {
        dbName: config.dbName,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000, // 45 second timeout
      });

      // Health Check Granularity: Ping the database to ensure responsiveness
      await mongoose.connection.db.admin().ping();
      logger.info(t("system:db.pingSuccess"));

      logger.info(t("system:db.connectSuccess"));
      return; // Connection successful, exit loop
    } catch (error) {
      logger.error(t("system:db.connectionError"), error);
      if (i < config.dbMaxRetries - 1) {
        // Use config.dbMaxRetries
        const delay = config.dbInitialRetryDelayMs * Math.pow(2, i); // Use config.dbInitialRetryDelayMs
        logger.warn(t("system:db.retryingConnection", { delay: delay / 1000 }));
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new DatabaseConnectionError(error); // Last attempt failed, re-throw custom error
      }
    }
  }
};

import User from "./models/user.model.js";
import EmailLog from "./models/email-log.model.js";

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info(t("system:db.disconnected"));
  } catch (error) {
    logger.error(t("system:db.disconnectError"), error);
    throw error; // Re-throw error
  }
};

export { connectDB, disconnectDB, User, EmailLog };
export default mongoose;
