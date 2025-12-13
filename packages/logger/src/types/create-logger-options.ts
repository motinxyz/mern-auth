/**
 * Logger Configuration Options
 */
export interface CreateLoggerOptions {
    /** Log level (default: from LOG_LEVEL env or "info") */
    level?: string;
    /** Service name for structured logs */
    serviceName?: string;
    /** Additional base fields */
    base?: Record<string, unknown>;
    /** Mixin function for adding dynamic fields */
    mixin?: () => Record<string, unknown>;
}
