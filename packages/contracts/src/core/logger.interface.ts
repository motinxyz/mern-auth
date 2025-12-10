/**
 * @auth/contracts - Logger Interface
 *
 * Defines the contract for logging operations.
 * Compatible with Pino logger API for structured logging.
 */

// =============================================================================
// Logger Interface
// =============================================================================

/**
 * Interface for logging operations.
 *
 * Provides structured logging with support for log levels,
 * contextual data, and child loggers for scoped logging.
 *
 * Compatible with Pino's logging API signature.
 *
 * @example
 * ```typescript
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error({ error }, 'Failed to process request');
 *
 * const childLogger = logger.child({ requestId: 'abc' });
 * childLogger.info('Processing request'); // Includes requestId
 * ```
 */
export interface ILogger {
    /**
     * Log at INFO level.
     * Use for general operational messages.
     *
     * @param obj - Contextual data object or message string
     * @param msg - Optional message (if obj is an object)
     * @param args - Additional format arguments
     */
    info(obj: object | string, msg?: string, ...args: unknown[]): void;

    /**
     * Log at WARN level.
     * Use for potentially problematic situations.
     *
     * @param obj - Contextual data object or message string
     * @param msg - Optional message (if obj is an object)
     * @param args - Additional format arguments
     */
    warn(obj: object | string, msg?: string, ...args: unknown[]): void;

    /**
     * Log at ERROR level.
     * Use for error conditions that should be investigated.
     *
     * @param obj - Contextual data object or message string
     * @param msg - Optional message (if obj is an object)
     * @param args - Additional format arguments
     */
    error(obj: object | string, msg?: string, ...args: unknown[]): void;

    /**
     * Log at DEBUG level.
     * Use for detailed diagnostic information.
     *
     * @param obj - Contextual data object or message string
     * @param msg - Optional message (if obj is an object)
     * @param args - Additional format arguments
     */
    debug(obj: object | string, msg?: string, ...args: unknown[]): void;

    /**
     * Log at FATAL level.
     * Use for unrecoverable errors causing shutdown.
     *
     * @param obj - Contextual data object or message string
     * @param msg - Optional message (if obj is an object)
     * @param args - Additional format arguments
     */
    fatal(obj: object | string, msg?: string, ...args: unknown[]): void;

    /**
     * Create a child logger with additional context.
     * Child loggers inherit parent context and add their own.
     *
     * @param bindings - Key-value pairs to include in all child logs
     * @returns New logger instance with merged context
     */
    child(bindings: Readonly<Record<string, unknown>>): ILogger;
}
