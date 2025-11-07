import mongoose from "mongoose";
import { config } from "@auth/config";
import { logger, t } from "@auth/config";

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
  try {
    logger.debug({
      msg: t("system:db.attemptingConnection"),
      dbName: config.dbName
    });
    
    await mongoose.connect(config.dbURI, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    logger.info(t("system:db.connectSuccess"));
  } catch (error) {
    logger.error({
      msg: t("system:db.connectionError"),
      error: error.message,
      code: error.code,
      name: error.name
    });
    throw error; // Let the caller handle the error
  }
};

import User from "./models/user.model.js";

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info(t("system:db.disconnected"));
  } catch (error) {
    logger.error(t("system:db.disconnectError"), error);
    // Similar to connection errors, a failure to disconnect might indicate
    // a larger issue, prompting a graceful shutdown.
  }
};

export { connectDB, disconnectDB, User };
export default mongoose;
