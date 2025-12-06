/**
 * ILogger - Interface for logging operations
 *
 * Compatible with Pino logger API
 */
export interface ILogger {
    /**
     * Log at info level
     */
    info(obj: object | string, msg?: string, ...args: unknown[]): void;
    /**
     * Log at warn level
     */
    warn(obj: object | string, msg?: string, ...args: unknown[]): void;
    /**
     * Log at error level
     */
    error(obj: object | string, msg?: string, ...args: unknown[]): void;
    /**
     * Log at debug level
     */
    debug(obj: object | string, msg?: string, ...args: unknown[]): void;
    /**
     * Log at fatal level
     */
    fatal(obj: object | string, msg?: string, ...args: unknown[]): void;
    /**
     * Create a child logger with additional context
     */
    child(bindings: Record<string, unknown>): ILogger;
}
//# sourceMappingURL=ILogger.d.ts.map