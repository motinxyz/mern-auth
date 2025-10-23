import mongoose from "mongoose";
import app from "./app.js";
import logger from "./config/logger.js";
import { getTranslator } from "./config/i18n.js";
import config from "./config/env.js";
const serverLogger = logger.child({ module: "server" });

let server;
async function startServer() {
  const PORT = config.port;
  try {
    const t = await getTranslator(); // Get default translator
    await mongoose.connect(config.dbURI, {
      dbName: "MernAuth",
    });
    serverLogger.info(t("system.dbConnected"));

    server = app.listen(PORT, () => {
      serverLogger.info(t("system.serverStarted").replace("%s", PORT));
    });
  } catch (error) {
    serverLogger.error({ err: error }, "Failed to start the server");
    // Throw the error to be caught by the process-wide handlers for a graceful shutdown
    throw error;
  }
}

startServer();

// graceful shutdown and error handling
let isShuttingDown = false;
const gracefulShutdown = async (signal, exitCode) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  serverLogger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    serverLogger.info("HTTP server closed.");
    try {
      await mongoose.connection.close(false);
      serverLogger.info("MongoDB connection closed.");
      process.exit(exitCode);
    } catch (error) {
      serverLogger.error(
        { err: error },
        "Error during MongoDB connection closure."
      );
      process.exit(1);
    }
  });
};

// Handle uncaught exceptions - synchronous errors
process.on("uncaughtException", (error) => {
  serverLogger.fatal(error, "UNCAUGHT EXCEPTION! 💥 Shutting down...");
  process.exit(1); // It's not safe to continue, so exit immediately
});

// Handle unhandled promise rejections - asynchronous errors
process.on("unhandledRejection", (error) => {
  serverLogger.fatal(error, "UNHANDLED REJECTION! 💥 Shutting down...");
  if (server) {
    gracefulShutdown("unhandledRejection", 1); // Exit with failure code
  } else {
    process.exit(1);
  }
});

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0)); // Exit with success code
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0)); // For Ctrl+C in development
