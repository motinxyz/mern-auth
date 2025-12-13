import { createLogger, type Logger } from "@auth/logger";

/**
 * Shared Internal Logger for the Observability package itself.
 * Used for logging errors/info during the initialization of metrics, tracing, and sentry.
 */
export const observabilityLogger: Logger = createLogger({
    serviceName: "devs-daily:observability",
});
