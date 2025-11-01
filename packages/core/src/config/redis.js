import config from "./env.js";

export const TOKEN_REDIS_PREFIXES = Object.freeze({
  VERIFY_EMAIL: config.redis.prefixes.verifyEmail,
});

export const AUTH_REDIS_PREFIXES = Object.freeze({
  VERIFY_EMAIL_RATE_LIMIT: config.redis.prefixes.verifyEmailRateLimit,
});