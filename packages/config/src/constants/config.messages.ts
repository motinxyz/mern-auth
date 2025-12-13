/**
 * Config Package Message Constants
 *
 * Centralized messages for dev-facing logs and errors in the config package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 */

export const CONFIG_MESSAGES = {
  // Redis messages
  REDIS_CONNECTED: "Redis connected successfully",
  REDIS_READY: "Redis ready to accept commands",
  REDIS_DISCONNECTED: "Redis disconnected",
  REDIS_CONNECTION_ERROR: "Redis connection error",
  REDIS_INIT_FAILED: "Failed to initialize Redis connection",

  // Redis Circuit Breaker messages
  REDIS_CB_OPENED:
    "Redis circuit breaker OPENED - Redis operations will fail fast",
  REDIS_CB_HALF_OPEN:
    "Redis circuit breaker HALF-OPEN - Testing Redis recovery",
  REDIS_CB_CLOSED: "Redis circuit breaker CLOSED - Redis recovered",
  REDIS_CB_COMMAND_FAILED: "Redis command failed",
  REDIS_CB_COMMAND_TIMEOUT: "Redis command timed out (>3s)",
  REDIS_CB_COMMAND_REJECTED: "Redis command rejected - circuit is OPEN",
  REDIS_CB_OPERATION_FAILED: "Redis operation failed through circuit breaker",
  REDIS_CB_GRACEFUL_DEGRADATION:
    "Non-critical Redis command failed, returning null for graceful degradation",

  // Sentry messages
  SENTRY_INITIALIZED: "Sentry initialized successfully",
  SENTRY_INIT_FAILED: "Failed to initialize Sentry",


  // i18n
  I18N_NO_LOCALES: "No language directories found in locales directory",
  I18N_DISCOVERY_FAILED: "Failed to discover i18n resources",

  // General
  SERVICE_INITIALIZED: "Service initialized successfully",
};

export const CONFIG_ERRORS = {
  // Redis
  MISSING_CONFIG: "Config is required for RedisService",
  MISSING_LOGGER: "Logger is required for RedisService",
  REDIS_URL_REQUIRED: "REDIS_URL is required",
  REDIS_INIT_FAILED: "Redis initialization failed",

  // Database
  DATABASE_CONFIG_REQUIRED: "Config is required for DatabaseService",
  DATABASE_LOGGER_REQUIRED: "Logger is required for DatabaseService",


  // Validation
  MONGO_URI_REQUIRED: "MONGO_URI is required",
  MONGO_URI_INVALID_FORMAT:
    "MONGO_URI must start with mongodb:// or mongodb+srv://",
  CLIENT_URL_INVALID: "CLIENT_URL must be a valid URL",
  REDIS_URL_INVALID: "REDIS_URL must be a valid URL",
  EMAIL_FROM_INVALID:
    "EMAIL_FROM must be a valid email or 'Name <email@example.com>' format",

  // General
  INVALID_CONFIGURATION: "Invalid configuration provided",
  MONOREPO_ROOT_NOT_FOUND: "Could not find monorepo root.",
};
