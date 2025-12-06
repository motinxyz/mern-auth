/**
 * Startup Logger
 *
 * A lightweight Pino logger for the startup phase, before the main logger is initialized.
 * Provides structured JSON logging with module context.
 *
 * NOTE: This logger intentionally uses process.env directly (not @auth/config)
 * because it runs BEFORE the config module is fully initialized.
 * Using config here would create a circular dependency.
 */
import pino from "pino";
/**
 * Create a child logger with module context
 * @param {string} module - Module name (e.g., 'tracing', 'metrics', 'shipper')
 * @returns {pino.Logger} Child logger with module context
 */
export declare function createModuleLogger(module: any): pino.Logger<never, boolean>;
//# sourceMappingURL=startup-logger.d.ts.map