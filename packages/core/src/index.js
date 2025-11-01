// Config
export { default as config } from "./config/env.js";
export { default as logger } from "./config/logger.js";
export { i18nInstance, i18nMiddleware } from "./config/i18n.js";
export { t as systemT } from "./config/system-logger.js";

// Constants
export * from "./constants/httpStatusCodes.js";
export * from "./constants/validation.constants.js";

// Core
export { default as ApiError } from "./core/api/ApiError.js";
export { default as ApiResponse } from "./core/api/ApiResponse.js";

// Errors
export * from "./errors/index.js";

// Middleware
export { errorHandler } from "./middleware/errorHandler.js";
export { default as setupMiddleware } from "./startup/middleware.js";

// Startup
export { default as redisClient } from "./startup/redisClient.js";

// Features
export * from "./features/queue/queue.constants.js";
export { addEmailJob } from "./features/queue/queue.service.js";

export {
  TOKEN_REDIS_PREFIXES,
  HASHING_ALGORITHM,
} from "./features/token/token.constants.js";

export { createVerificationToken } from "./features/token/token.service.js";
export { authLimiter } from "./middleware/rateLimiter.js";
export { validate } from "./middleware/validate.js";
export {
  VERIFICATION_STATUS,
  AUTH_REDIS_PREFIXES,
  RATE_LIMIT_DURATIONS,
} from "./features/auth/auth.constants.js";
