/**
 * CRITICAL: Initialize OpenTelemetry FIRST (before any other imports)
 * This ensures all HTTP, Express, MongoDB, Redis calls are automatically traced
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
// Use Google DNS to prevent EAI_AGAIN errors after network changes
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { initializeTracing, initializeMetrics, } from "@auth/config/observability";
// Initialize tracing (must be first!)
initializeTracing();
// Initialize metrics
initializeMetrics();
// Now import the rest
import app from "./app.js";
import { bootstrapApplication } from "@auth/app-bootstrap";
import { getLogger, redisConnection, config, QUEUE_NAMES, WORKER_CONFIG, } from "@auth/config";
const logger = getLogger();
import { getDatabaseService, getEmailService } from "@auth/app-bootstrap";
import WorkerService from "@auth/worker";
import { createEmailJobConsumer } from "@auth/worker/consumers/email";
import { initSentry } from "./middleware/core/sentry.js";
import { API_MESSAGES } from "./constants/api.messages.js";
import { startWorker } from "./worker.setup.js";
// Initialize Sentry
const Sentry = initSentry();
// Get database service (lazy initialization)
const databaseService = getDatabaseService();
// Get email service (lazy initialization)
// Get email service (lazy initialization)
const emailService = getEmailService();
let workerService;
// Start the application by bootstrapping all services and starting the server.
await bootstrapApplication(app, async () => {
    if (workerService) {
        logger.info(API_MESSAGES.WORKER_SHUTDOWN_INIT);
        await workerService.stop();
        logger.info(API_MESSAGES.WORKER_SHUTDOWN_COMPLETE);
    }
});
// Start worker in the same process using the decoupled setup
workerService = await startWorker({
    logger,
    databaseService,
    emailService,
    sentry: Sentry,
});
// Log health and metrics periodically (only in production)
if (config.nodeEnv === "production") {
    setInterval(async () => {
        const health = await workerService.getHealth();
        const metrics = workerService.getMetrics();
        logger.debug({ health, metrics }, API_MESSAGES.WORKER_HEALTH_CHECK);
    }, 300000 // 5 minutes
    );
}
//# sourceMappingURL=server.js.map