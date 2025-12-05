import CircuitBreaker from "opossum";

/**
 * Circuit Breaker Configuration
 * Default configuration for circuit breakers
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  timeout: 3000, // 3 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000, // 10 second window for error calculation
  rollingCountBuckets: 10, // Number of buckets in the window
  name: "CircuitBreaker",
};

/**
 * Create a circuit breaker for async operations
 * @param {Function} operation - The async operation to wrap
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker} Configured circuit breaker
 */
export const createCircuitBreaker = (operation, options = {}) => {
  const config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...options };

  const breaker = new CircuitBreaker(operation, config);

  // No default event handlers - consumers should add their own with proper logging
  // Example:
  // breaker.on('open', () => logger.warn('Circuit opened'));
  // breaker.on('close', () => logger.info('Circuit closed'));

  return breaker;
};
