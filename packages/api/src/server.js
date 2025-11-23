import app from "./app.js";
import { bootstrapApplication } from "@auth/app-bootstrap";
import { logger } from "@auth/config";
import emailProcessor from "@auth/worker/src/email.processor.js"; // Import worker to start it

// Start the application by bootstrapping all services and starting the server.
await bootstrapApplication(app);

// Log that worker is also running in this process
logger.info("Worker services (Email Processor) started in API process.");
