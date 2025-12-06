import rateLimit from "express-rate-limit";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { RedisStore } = require("rate-limit-redis");
import { config, t, redisConnection } from "@auth/config";

// Basic rate limiting middleware for all API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args) => redisConnection.call(...args),
    prefix: "rl:api:",
  }),
  message: (req, res) => {
    const retryAfterMinutes = Math.ceil(res.getHeader("Retry-After") / 60);
    return (t as any)("rateLimit:apiTooManyRequests", { retryAfterMinutes });
  },
});

// Stricter rate limiting for authentication routes
// Stricter rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisConnection.call(...args),
    prefix: "rl:auth:",
  }),
  message: (req, res) => {
    const retryAfterMinutes = Math.ceil(res.getHeader("Retry-After") / 60);
    return (t as any)("rateLimit:authTooManyAttempts", { retryAfterMinutes });
  },
  // `skip` is the recommended way to disable rate limiting.
  skip: (req, res) => {
    const isDev = config.isDevelopment;
    // if (isDev) logger.debug("Auth rate limit skipped for development.");
    return isDev;
  },
});
