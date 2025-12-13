/**
 * Startup Logger
 *
 * A logger for the startup phase, before the main logger is initialized.
 * Uses @auth/logger which reads from process.env directly.
 */

import { createLogger, type Logger } from "@auth/logger";

/**
 * Create a child logger with module context
 * @param module - Module name (e.g., 'tracing', 'metrics')
 * @returns Child logger with module context
 */
export function createModuleLogger(module: string): Logger {
    return createLogger({ serviceName: `devs-daily:${module}` });
}