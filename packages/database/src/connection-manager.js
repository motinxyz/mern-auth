import mongoose from "mongoose";
import { ConfigurationError } from "@auth/utils";
import { DB_MESSAGES, DB_ERRORS } from "./constants/database.messages.js";

/**
 * Database Connection Manager
 * Provides connection state management and health checks
 */
class DatabaseConnectionManager {
  constructor(options = {}) {
    if (!options.config) {
      throw new ConfigurationError(
        DB_ERRORS.MISSING_CONFIG.replace("{option}", "config")
      );
    }
    if (!options.logger) {
      throw new ConfigurationError(DB_ERRORS.MISSING_LOGGER);
    }

    this.config = options.config;
    this.logger = options.logger;
    this.isConnected = false;
  }

  /**
   * Setup event listeners for connection lifecycle
   */
  setupEventListeners() {
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
    this.setupEventListeners();

    for (let i = 0; i < this.config.dbMaxRetries; i++) {
      try {
        this.logger.debug(
          {
            dbName: this.config.dbName,
            attempt: i + 1,
            maxAttempts: this.config.dbMaxRetries,
          },
          DB_MESSAGES.ATTEMPTING_CONNECTION
        );

        await mongoose.connect(this.config.dbURI, {
          dbName: this.config.dbName,
          // Connection Pool Settings (optimized for high concurrency)
          maxPoolSize: this.config.dbPoolSize || 100,
          minPoolSize: this.config.dbMinPoolSize || 10,
          maxIdleTimeMS: this.config.dbMaxIdleTimeMs || 30000,
          waitQueueTimeoutMS: this.config.dbWaitQueueTimeoutMs || 10000,
          // Timeout Settings
          serverSelectionTimeoutMS:
            this.config.serverSelectionTimeoutMs || 5000,
          socketTimeoutMS: this.config.socketTimeoutMs || 45000,
        });

        // Health check
        await mongoose.connection.db.admin().ping();
        this.logger.info({ module: "database" }, DB_MESSAGES.PING_SUCCESS);
        this.logger.info({ module: "database" }, DB_MESSAGES.CONNECT_SUCCESS);

        this.isConnected = true;
        return;
      } catch (error) {
        this.logger.error({ err: error }, DB_ERRORS.CONNECTION_ERROR);

        if (i < this.config.dbMaxRetries - 1) {
          const delay = this.config.dbInitialRetryDelayMs * Math.pow(2, i);
          this.logger.warn(
            DB_MESSAGES.RETRYING_CONNECTION.replace(
              "{delay}",
              (delay / 1000).toString()
            )
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          const { DatabaseConnectionError } = await import("@auth/utils");
          throw new DatabaseConnectionError(error);
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
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return states[mongoose.connection.readyState] || "unknown";
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) {
      return { healthy: false, reason: DB_MESSAGES.NOT_CONNECTED };
    }

    try {
      await mongoose.connection.db.admin().ping();
      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Simple ping check
   */
  async ping() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error(DB_MESSAGES.NOT_CONNECTED);
    }
    await mongoose.connection.db.admin().ping();
    return true;
  }
}

export default DatabaseConnectionManager;
