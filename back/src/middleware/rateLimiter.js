import rateLimit from "express-rate-limit";
import config from "../config/env.js";
import logger from "../config/logger.js";

// Basic rate limiting middleware for all API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Stricter rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per `windowMs` (in production)
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Too many authentication attempts from this IP, please try again after 15 minutes",
  // `skip` is the recommended way to disable rate limiting.
  skip: (req, res) => {
    const isDev = config.isDevelopment;
    // if (isDev) logger.debug("Auth rate limit skipped for development.");
    return isDev;
  },
});
