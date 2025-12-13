/**
 * Database Package Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because they are dev-facing logs.
 */

export const DB_MESSAGES = {
  // Connection Messages
  ATTEMPTING_CONNECTION: "Attempting MongoDB connection",
  CONNECTED: "MongoDB connected",
  DISCONNECTED: "MongoDB disconnected",
  PING_SUCCESS: "Database ping successful.",
  CONNECT_SUCCESS: "MongoDB connected successfully",
  RETRYING_CONNECTION: "Retrying connection in {delay} seconds",

  // Health Check
  NOT_CONNECTED: "Not connected",
};

export const DB_ERRORS = {
  // Configuration Errors
  MISSING_CONFIG: "DatabaseService requires '{option}' option",
  MISSING_LOGGER: "DatabaseConnectionManager requires 'logger' option",
  MISSING_MODEL: "{repository} requires 'model' parameter",

  // Connection Errors
  CONNECTION_ERROR: "Database connection error",
  DISCONNECT_ERROR: "Database disconnect error",
};
