/**
 * App-Bootstrap Package Message Constants
 *
 * Centralized dev-facing messages for the app-bootstrap package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 */

// ============================================================================
// SERVICE INITIALIZATION MESSAGES
// ============================================================================

export const BOOTSTRAP_MESSAGES = {
  // Success/Info
  ALL_SERVICES_STARTED: "All services started successfully",
  SERVER_START_SUCCESS: "Server is listening on port",
  I18N_INITIALIZED: "i18n initialized successfully",

  // Shutdown
  SHUTDOWN_SIGNAL_RECEIVED: "Shutdown signal received",
  SERVER_CLOSED: "HTTP server closed successfully",
  SHUTDOWN_TIMEOUT_EXCEEDED: "Graceful shutdown timeout exceeded, forcing exit",
  CUSTOM_SHUTDOWN_ERROR: "Error during custom shutdown handler",

  // Errors
  DATABASE_CONNECTION_FAILED: "Database connection failed after retries",
  REDIS_CONNECTION_FAILED: "Redis connection failed after retries",
  SERVICE_START_ERROR: "Service failed to start",
  FAILED_TO_START_SERVICES: "Failed to start critical services",
};

export const BOOTSTRAP_ERRORS = {
  CRITICAL_SERVICE_FAILURE: "Critical service initialization failed",
  SHUTDOWN_HANDLER_FAILED: "Shutdown handler failed",
  DATABASE_UNAVAILABLE: "Database unavailable",
  REDIS_UNAVAILABLE: "Redis unavailable",
};
