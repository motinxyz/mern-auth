export const DEFAULTS = {
  NODE_ENV: "development",
  PORT: 3001,
  CLIENT_URL: "http://localhost:3000",
  VERIFICATION_TOKEN_EXPIRES_IN: 300, // 5 minutes
  LOG_LEVEL: "info",
  DB_NAME: "MernAuth",
  REDIS_PREFIX_VERIFY_EMAIL: "verify:",
  REDIS_PREFIX_VERIFY_EMAIL_RATE_LIMIT: "verify-email-rate-limit:",
  BCRYPT_SALT_ROUNDS: 12,
  DB_MAX_RETRIES: 10,
  DB_INITIAL_RETRY_DELAY_MS: 2000, // 2 seconds
  SHUTDOWN_TIMEOUT_MS: 10000, // 10 seconds
  REDIS_MAX_RETRIES: 5,
  REDIS_RETRY_DELAY_MS: 1000, // 1 second

  // MongoDB Connection Pool (optimized for 10K concurrent users)
  DB_POOL_SIZE: 100, // Max connections in pool
  DB_MIN_POOL_SIZE: 10, // Min connections kept open
  DB_MAX_IDLE_TIME_MS: 30000, // Close idle connections after 30s
  DB_WAIT_QUEUE_TIMEOUT_MS: 10000, // Wait max 10s for available connection
  DB_SERVER_SELECTION_TIMEOUT_MS: 5000, // 5s to select server
  DB_SOCKET_TIMEOUT_MS: 45000, // 45s socket timeout

  // Worker Configuration
  WORKER_CONCURRENCY: 5,
  WORKER_MAX_RETRIES: 3,
  WORKER_BACKOFF_DELAY_MS: 1000,
  WORKER_STALLED_INTERVAL_MS: 60000,
};

export const urlRegex = /^(https?|ftp|redis|rediss):\/\/[^\s/$.?#].*$/i;

export const Environments = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
};
