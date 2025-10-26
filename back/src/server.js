// =================================================================
// Load environment variables FIRST.
// This ensures that all subsequent modules have access to them.
// The EnvironmentError will be thrown here if config is invalid.
// =================================================================
import config from "./config/env.js";
// =================================================================

import mongoose from "mongoose";
import http from "node:http";
import app from "./app.js";
import baseLogger, { t as systemT } from "./config/system-logger.js";
import redisClient from "./startup/redisClient.js";
import { EnvironmentError } from "./errors/index.js";

const serverLogger = baseLogger.child({ module: "server" });

let server;

/**
 * Connects to the primary database (MongoDB).
 * @throws {Error} If the database connection fails.
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(config.dbURI, {
      dbName: "MernAuth",
    });
    serverLogger.info(systemT("common:system.dbConnected"));
  } catch (error) {
    serverLogger.error({ err: error }, systemT("common:system.dbConnectionError"));
    throw error;
  }
}

/**
 * Starts the HTTP server.
 * @returns {Promise<http.Server>} A promise that resolves to the running server instance.
 */
function startHttpServer() {
  return new Promise((resolve, reject) => {
    const PORT = config.port;
    server = app.listen(PORT, () => {
      serverLogger.info(
        { port: PORT },
        systemT("common:system.serverStarted", { port: PORT })
      );
      resolve(server);
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

// =================================================================
// Graceful Shutdown Logic
// =================================================================
let isShuttingDown = false;

/**
 * Shuts down the application gracefully.
 * @param {string} signal - The signal that triggered the shutdown (e.g., 'SIGTERM').
 * @param {number} exitCode - The exit code to use.
 */
async function gracefulShutdown(signal, exitCode) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  serverLogger.info({ signal }, systemT("common:system.shutdownSignal", { signal }));

  // 1. Close the HTTP server to stop accepting new connections.
  if (server) {
    server.close(async () => {
      serverLogger.info(systemT("common:system.httpServerClosed"));
      // 2. Close database connections.
      await closeDbConnections();
      process.exit(exitCode);
    });

    // Force close server after 10 seconds if connections are still open
    setTimeout(() => {
      serverLogger.warn(
        "Could not close connections in time, forcefully shutting down."
      );
      process.exit(exitCode);
    });
  } else {
    // If the server never started, just close DB connections.
    await closeDbConnections();
    process.exit(exitCode);
  }
}

/**
 * Closes all database and cache connections.
 */
async function closeDbConnections() {
  try {
    await Promise.all([mongoose.connection.close(false), redisClient.quit()]);
    serverLogger.info(systemT("common:system.dbConnectionsClosed"));
  } catch (error) {
    serverLogger.error({ err: error }, systemT("common:errors.shutdownDbError"));
  }
}

// =================================================================
// Process-wide Error and Signal Handling
// =================================================================
process.on("uncaughtException", (error) => {
  serverLogger.fatal(error, systemT("common:errors.uncaughtException"));
  // It's not safe to attempt a graceful shutdown here, so exit immediately.
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  serverLogger.fatal(error, systemT("common:errors.unhandledRejection"));
  // For unhandled rejections, a graceful shutdown is appropriate.
  gracefulShutdown("unhandledRejection", 1);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));

// =================================================================
// Application Entry Point
// =================================================================
(async () => {
  try {
    // The redisClient connects automatically due to top-level await in its module.
    await connectToDatabase();
    await startHttpServer();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      serverLogger.fatal(
        { validationErrors: error.errors },
        systemT(error.message)
      );
    } else {
      serverLogger.error({ err: error }, systemT("common:errors.serverStartFailed"));
    }
    process.exit(1);
  }
})();
