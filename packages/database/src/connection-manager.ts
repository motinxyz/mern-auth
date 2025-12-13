import mongoose from "mongoose";
import { ConfigurationError, DatabaseConnectionError } from "@auth/utils";
import type { ILogger, IConfig } from "@auth/contracts";
import { DB_MESSAGES, DB_ERRORS } from "./constants/database.messages.js";

// MODULE-LEVEL guard is not sufficient with hot-reloading behavior
// We will check listener counts directly on the connection object

/**
 * Database Connection Manager
 * Provides connection state management and health checks
 */
class DatabaseConnectionManager {
  public config: IConfig;
  public logger: ILogger;
  public isConnected: boolean;

  constructor(options: { config: IConfig; logger: ILogger }) {
    if (options.config === undefined || options.config === null) {
      throw new ConfigurationError(
        DB_ERRORS.MISSING_CONFIG.replace("{option}", "config")
      );
    }
    if (options.logger === undefined || options.logger === null) {
      throw new ConfigurationError(DB_ERRORS.MISSING_LOGGER);
    }

    this.config = options.config;
    this.logger = options.logger;
    this.isConnected = false;
  }

  /**
   * Setup event listeners for connection lifecycle
   * Checks actual listener count to prevent duplicates across reloads
   */
  setupEventListeners() {
    // Check if listeners are already registered on the singleton connection
    // This handles both multiple instances AND hot-module reloading
    if (mongoose.connection.listenerCount("connected") > 0) {
      return;
    }

    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      this.logger.info({ module: "database" }, DB_MESSAGES.CONNECTED);
    });

    mongoose.connection.on("error", (err) => {
      this.logger.error({ err }, DB_ERRORS.CONNECTION_ERROR);
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      this.logger.warn(DB_MESSAGES.DISCONNECTED);
    });
  }

  /**
   * Connect to database with retry logic
   */
  async connect() {
    // Idempotency check: if already connected, do nothing
    if (this.isConnected || mongoose.connection.readyState === 1) {
      return;
    }

    this.setupEventListeners();

    const maxRetries = this.config.dbMaxRetries ?? 5;
    const initialRetryDelay = this.config.dbInitialRetryDelayMs ?? 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        this.logger.debug(
          {
            dbName: this.config.dbName,
            attempt: i + 1,
            maxAttempts: maxRetries,
          },
          DB_MESSAGES.ATTEMPTING_CONNECTION
        );

        const uri = this.config.dbURI;

        if (uri === undefined || uri === null || uri === "") {
          throw new ConfigurationError("Missing Database Connection String");
        }

        await mongoose.connect(uri, {
          dbName: this.config.dbName,
          // Connection Pool Settings (optimized for high concurrency)
          maxPoolSize: this.config.dbPoolSize ?? 100,
          minPoolSize: this.config.dbMinPoolSize ?? 10,
          maxIdleTimeMS: this.config.dbMaxIdleTimeMs ?? 30000,
          waitQueueTimeoutMS: this.config.dbWaitQueueTimeoutMs ?? 10000,
          // Timeout Settings
          serverSelectionTimeoutMS:
            this.config.serverSelectionTimeoutMs ?? 5000,
          socketTimeoutMS: this.config.socketTimeoutMs ?? 45000,
        });

        // Health check
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
        }

        this.logger.info({ module: "database" }, DB_MESSAGES.PING_SUCCESS);
        this.logger.info({ module: "database" }, DB_MESSAGES.CONNECT_SUCCESS);

        this.isConnected = true;
        return;
      } catch (error) {
        this.logger.error({ err: error }, DB_ERRORS.CONNECTION_ERROR);

        if (i < maxRetries - 1) {
          const delay = initialRetryDelay * Math.pow(2, i);
          this.logger.warn(
            DB_MESSAGES.RETRYING_CONNECTION.replace(
              "{delay}",
              (delay / 1000).toString()
            )
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw new DatabaseConnectionError(error instanceof Error ? error.message : String(error));
        }
      }
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.logger.info({ module: "database" }, DB_MESSAGES.DISCONNECTED);
    } catch (error) {
      this.logger.error({ err: error }, DB_ERRORS.DISCONNECT_ERROR);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateLabel: this.getReadyStateLabel(),
    };
  }

  /**
   * Get human-readable connection state
   */
  getReadyStateLabel() {
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[mongoose.connection.readyState] ?? "unknown";
  }

  /**
   * Health check
   */
  async healthCheck() {
    // If not connected, try to ping to trigger auto-reconnect
    // Don't fail immediately on isConnected flag since we might be idle (minPoolSize: 0)
    try {
      if (mongoose.connection.readyState === 0) {
        // If strictly disconnected, we can't ping without explicit connect.
        // But preventing the check prevents recovery.
      }

      if (!mongoose.connection.db) {
        return { healthy: false, reason: DB_MESSAGES.NOT_CONNECTED };
      }

      await mongoose.connection.db.admin().ping();
      return { healthy: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { healthy: false, reason: errorMessage };
    }
  }

  /**
   * Simple ping check
   */
  async ping() {
    // Relaxation: Don't check readyState === 1 strictly.
    // Allow Mongoose to buffer/reconnect if needed.
    if (!mongoose.connection.db) {
      throw new Error(DB_MESSAGES.NOT_CONNECTED);
    }

    await mongoose.connection.db.admin().ping();
    return true;
  }
}

export default DatabaseConnectionManager;
