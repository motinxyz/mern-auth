import app from "./app.js";
import { config, logger } from "@auth/config";
import mongoose, { connectDB, disconnectDB } from "@auth/database";

async function startServer() {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

const server = await startServer();

const gracefulShutdown = async () => {
  logger.info("Shutting down gracefully");
  server.close(async () => {
    logger.info("Server closed");
    await disconnectDB();
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default server;