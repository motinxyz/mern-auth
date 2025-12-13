/**
 * @auth/config - Configuration Package Entry Point
 *
 * This module provides centralized configuration for all packages.
 * Uses lazy initialization patterns to avoid side-effects on import.
 *
 * NOTE: Logging has been moved to @auth/observability
 * NOTE: Redis, i18n, and queue constants have been extracted to dedicated packages:
 * - @auth/redis
 * - @auth/i18n
 * - @auth/queues
 */

// Export configuration
export { default as config } from "./env.js";


