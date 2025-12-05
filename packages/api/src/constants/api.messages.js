/**
 * API Package Message Constants
 *
 * Centralized dev-facing messages for the API package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 */

// ============================================================================
// SERVER MESSAGES
// ============================================================================

export const API_MESSAGES = {
  // Cache
  CACHE_HIT: "Cache HIT",
  CACHE_MISS: "Cache MISS",
  CACHE_RESPONSE_SAVED: "Response cached successfully",
  CACHE_SAVE_FAILED: "Failed to cache response",
  CACHE_ERROR: "Cache middleware error, continuing without cache",
  CACHE_INVALIDATED: "Cache invalidated successfully",
  CACHE_INVALIDATE_FAILED: "Failed to invalidate cache",
  CACHE_NO_KEYS_FOUND: "No cache keys found to invalidate",

  // API Version
  API_VERSION_REQUEST: "API version request",
  API_VERSION_DEPRECATED: "Deprecated API version used",

  // Worker
  WORKER_SHUTDOWN_INIT: "Shutting down worker services...",
  WORKER_SHUTDOWN_COMPLETE: "Worker services stopped.",
  WORKER_STARTED: "Worker service started with processor(s)",
  WORKER_HEALTH_CHECK: "Worker health check",
};
