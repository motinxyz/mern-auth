import mongoose from "mongoose";
import { config } from "@auth/config";
import { logger } from "@auth/config";

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
  process.exit(1);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

const connectDB = async () => {
  try {
    logger.debug({
      msg: 'Attempting MongoDB connection',
      uri: config.dbURI,
      dbName: config.dbName
    });
    
    await mongoose.connect(config.dbURI, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({
      msg: 'MongoDB connection error',
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
    logger.info("MongoDB disconnected");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    process.exit(1);
  }
};

export { connectDB, disconnectDB, User };
export default mongoose;
