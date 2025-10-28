// =================================================================
// Load environment variables FIRST.
// =================================================================
import config from "./config/env.js";
import baseLogger, { t as systemT } from "./config/system-logger.js";
import redisClient from "./startup/redisClient.js";
import { EnvironmentError } from "./errors/index.js";
// =================================================================

import mongoose from "mongoose";
import app from "./app.js";
// import "./features/queue/email.worker.js"; // Import the worker to start it in the same process

const serverLogger = baseLogger.child({ module: "server" });

let server;
// let emailWorker;

/**
 * Connects to the primary database (MongoDB).
 * @throws {Error} If the database connection fails.
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(config.dbURI, {
      dbName: "MernAuth",
    });
    serverLogger.info(systemT("system:db.connectSuccess"));
  } catch (error) {
    serverLogger.error(
      { err: error },
      systemT("system:db.connectError")
    );
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
        systemT("system:server.startSuccess", { port: PORT })
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

  serverLogger.info(
    { signal },
    systemT("system:process.shutdownSignal", { signal })
  );

  // 1. Close the HTTP server to stop accepting new connections.
  if (server) {
    server.close(async () => {
      serverLogger.info(systemT("system:server.closeSuccess"));
      // 2. Close database connections.
      await closeDbConnections();
      process.exit(exitCode);
    });

    // Force close server after a timeout if connections are still open
    setTimeout(() => {
      serverLogger.warn(systemT("system:process.errors.shutdownTimeout"));
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
    serverLogger.info(systemT("system:db.closeSuccess"));
  } catch (error) {
    serverLogger.error(
      { err: error },
      systemT("system:db.closeError")
    );
  }
}

// =================================================================
// Process-wide Error and Signal Handling
// =================================================================
process.on("uncaughtException", (error) => {
  serverLogger.fatal(error, systemT("system:process.errors.uncaughtException"));
  // It's not safe to attempt a graceful shutdown here, so exit immediately.
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  serverLogger.fatal(error, systemT("system:process.errors.unhandledRejection"));
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
    // ioredis connects automatically, so no explicit connect call is needed here.
    await connectToDatabase();
    await startHttpServer();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      serverLogger.fatal(
        { validationErrors: error.errors },
        systemT(error.message)
      );
    } else {
      serverLogger.error(
        { err: error },
        systemT("system:server.startError")
      );
    }
    process.exit(1);
  }
})();
