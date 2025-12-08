/**
 * CRITICAL: Initialize OpenTelemetry FIRST (before any other imports)
 * This ensures all HTTP, Express, MongoDB, Redis calls are automatically traced
 */
import dns from "node:dns";

// Optimization: Use IPv4 first and Google DNS to prevent EAI_AGAIN errors in some environments
// This is a common fix for Node.js 17+ preferring IPv6 in dual-stack environments
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import {
  initializeTracing,
  initializeMetrics,
} from "@auth/config/observability";

// Initialize tracing (must be first!)
initializeTracing();

// Initialize metrics
initializeMetrics();

// Now import the rest
import app from "./app.js";
import { bootstrapApplication, getDatabaseService, getEmailService } from "@auth/app-bootstrap";
import { getLogger, config } from "@auth/config";
import { initSentry } from "./middleware/core/sentry.js";
import { API_MESSAGES } from "./constants/api.messages.js";
import { startWorker } from "./worker.setup.js";
import type { ISentry } from "@auth/contracts";
import type WorkerService from "@auth/worker";

const logger = getLogger();

// Initialize Sentry
const Sentry = initSentry();

// Get database & email services (lazy initialization)
// These calls just retrieve the singleton holders, actual connection happens in bootstrapApplication
const databaseService = getDatabaseService();
const emailService = getEmailService();

let workerService: WorkerService | undefined;

// Start the application by bootstrapping all services and starting the server.
await bootstrapApplication(app, async () => {
  // Graceful shutdown callback
  if (workerService) {
    logger.info(API_MESSAGES.WORKER_SHUTDOWN_INIT);
    await workerService.stop();
    logger.info(API_MESSAGES.WORKER_SHUTDOWN_COMPLETE);
  }
});

// Sentry Adapter - Boundary between specific @sentry/node implementation and our generic ISentry contract
const sentryAdapter: ISentry = {
  captureException: (error, context) => {
    Sentry.captureException(error, { extra: context });
  },
  captureMessage: (message, options) => {
    Sentry.captureMessage(message, {
      level: options?.level as "info" | "warning" | "error" | "debug" | "fatal" | undefined,
      extra: options?.extra
    });
  }
};

// Start worker in the same process using the decoupled setup
// This allows the API to process background jobs (simplified deployment)
workerService = await startWorker({
  logger,
  databaseService,
  emailService,
  sentry: sentryAdapter,
});

// Log health and metrics periodically (only in production)
if (config.env === "production" && workerService) {
  const service = workerService;
  // Log worker health every 5 minutes
  setInterval(
    async () => {
      try {
        const health = await service.getHealth();
        const metrics = service.getMetrics();
        logger.debug({ health, metrics }, API_MESSAGES.WORKER_HEALTH_CHECK);
      } catch (error) {
        logger.error({ err: error }, "Failed to log worker health");
      }
    },
    300_000 // 5 minutes
  );
}
