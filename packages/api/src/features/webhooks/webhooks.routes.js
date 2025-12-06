import express from "express";
import { webhooksController } from "./webhooks.controller.js";

const router = express.Router();

/**
 * Verify Resend/Svix webhook signature
 * Svix signature format: "v1,<signature>"
 */
/**
 * Webhook endpoint for Resend email events
 * POST /webhooks/resend
 *
 * Handles: email.bounced, email.complained, email.delivered
 */
router.post(
  "/resend",
  express.raw({ type: "application/json" }),
  webhooksController.handleResendWebhook
);

/**
 * Webhook endpoint for MailerSend email events
 * POST /webhooks/mailersend
 */
router.post(
  "/mailersend",
  express.raw({ type: "application/json" }),
  webhooksController.handleMailerSendWebhook
);

/**
 * Health check endpoint for webhooks
 * GET /webhooks/health
 */
router.get("/health", webhooksController.checkHealth);

export default router;
