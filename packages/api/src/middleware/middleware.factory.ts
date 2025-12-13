/**
 * Middleware Factory - Composition Root
 *
 * Central place to create all middleware instances with injected dependencies.
 * This follows the Gold Standard DI pattern - all dependencies are created here
 * and passed down to middleware factories.
 */

import type { RequestHandler, Router } from "express";
import type { IDatabaseService, IRedisConnection } from "@auth/contracts";
import { createCacheMiddleware, createCacheInvalidator, type CacheOptions } from "./security/cache.js";
import { createApiLimiter, createAuthLimiter } from "./security/rateLimiter.js";
import { createHealthController, type HealthController } from "../features/health/health.controller.js";
import { createReadinessHandler, livenessHandler } from "../features/health/health.handlers.js";
import { createHealthRoutes } from "../features/health/health.routes.js";

/**
 * Middleware Dependencies
 */
export interface MiddlewareDeps {
    redis: IRedisConnection;
    databaseService: IDatabaseService;
}

/**
 * Created Middleware Instances
 */
export interface CreatedMiddleware {
    // Rate limiters
    apiLimiter: RequestHandler;
    authLimiter: RequestHandler;

    // Cache
    cacheMiddleware: (duration: number, options?: CacheOptions) => RequestHandler;
    invalidateCache: (pattern: string) => Promise<number>;

    // Health
    healthController: HealthController;
    healthRoutes: Router;
    livenessHandler: RequestHandler;
    readinessHandler: RequestHandler;
}

/**
 * Create all middleware instances
 *
 * Factory that creates all middleware with injected dependencies.
 * Called once during app initialization.
 *
 * @param deps - Injected dependencies (Redis, DatabaseService)
 * @returns Object containing all middleware instances
 */
export function createMiddleware(deps: MiddlewareDeps): CreatedMiddleware {
    const { redis, databaseService } = deps;

    // Create rate limiters
    const apiLimiter = createApiLimiter({ redis });
    const authLimiter = createAuthLimiter({ redis });

    // Create cache middleware factory
    const cacheFactory = createCacheMiddleware({ redis });
    const cacheInvalidator = createCacheInvalidator({ redis });

    // Create health controller and handlers
    const healthController = createHealthController({ redis, databaseService });
    const readinessHandler = createReadinessHandler({ redis });
    const healthRoutes = createHealthRoutes(healthController);

    return {
        apiLimiter,
        authLimiter,
        cacheMiddleware: cacheFactory,
        invalidateCache: cacheInvalidator,
        healthController,
        healthRoutes,
        livenessHandler,
        readinessHandler,
    };
}
