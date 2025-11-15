// Auth Feature
export { default as authRouter } from "./auth/auth.routes.js";
export { registerNewUser, verifyUserEmail } from "./auth/auth.service.js";

// Middleware
export { errorHandler } from "./middleware/errorHandler.js";
export { authLimiter } from "./middleware/rateLimiter.js";
export { validate } from "./middleware/validate.js";

// Token Service
export { createVerificationToken } from "./features/token/token.service.js";

// Setup functions
export { default as setupMiddleware } from "./startup/middleware.js";
export { default as setupRoutes } from "./startup/routes.js";