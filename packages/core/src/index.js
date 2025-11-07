// Auth Feature
export { default as authRouter } from "./features/auth/auth.routes.js";
export {
  registerNewUser,
  verifyUserEmail,
} from "./features/auth/auth.service.js";

// Middleware
export { errorHandler } from "./middleware/errorHandler.js";
export { httpLogger } from "./middleware/loggerMiddleware.js";
export { authLimiter } from "./middleware/rateLimiter.js";
export { validate } from "./middleware/validate.js";

// Token Service
export { createVerificationToken } from "./features/token/token.service.js";




