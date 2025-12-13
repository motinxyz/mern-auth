import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { observabilityConfig, isSentryEnabled } from "../config.js";
import { createModuleLogger } from "../startup-logger.js";

const logger = createModuleLogger("sentry");

/**
 * Initialize Sentry
 * Configures error tracking and performance monitoring.
 */
export function initializeSentry(): void {
    if (!isSentryEnabled() || observabilityConfig.sentry.dsn === undefined || observabilityConfig.sentry.dsn === "") {
        logger.info("Sentry disabled (DSN missing or disabled via env)");
        return;
    }

    try {
        Sentry.init({
            dsn: observabilityConfig.sentry.dsn,
            environment: observabilityConfig.sentry.environment,
            release: observabilityConfig.sentry.release,
            integrations: [
                nodeProfilingIntegration(),
                // Enable HTTP tracing if OTel is not doing it (Ref: Sentry OTel guide)
                // For now, we focus on Error Tracking as OTel handles Tracing
            ],
            // Performance Monitoring
            tracesSampleRate: 0.1, // Sample 10% of transactions (adjust for prod traffic)
            profilesSampleRate: 0.1, // Profiling sample rate
        });

        logger.info("Sentry initialized successfully");
    } catch (error) {
        logger.error({ err: error }, "Failed to initialize Sentry");
    }
}
