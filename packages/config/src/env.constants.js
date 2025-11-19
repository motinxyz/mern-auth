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
};

export const urlRegex = /^(https?|ftp|redis|rediss):\/\/[^\s/$.?#].*$/i;

export const Environments = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
};
