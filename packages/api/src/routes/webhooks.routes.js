import express from "express";
import { handleBounce } from "@auth/email";
import { logger } from "@auth/config";

const router = express.Router();
const webhookLogger = logger.child({ module: "webhooks" });

/**
 * Webhook endpoint for email bounce notifications
 * POST /webhooks/email/bounce
 *
 * Expected payload:
 * {
 *   email: string,
 *   messageId: string,
 *   bounceType: 'hard' | 'soft' | 'complaint',
 *   bounceReason: string,
 *   timestamp?: Date
 * }
 */
router.post("/email/bounce", async (req, res) => {
  try {
    webhookLogger.info({ body: req.body }, "Received bounce webhook");

    const result = await handleBounce(req.body);

    if (result.success) {
      webhookLogger.info({ result }, "Bounce handled successfully");
      res.status(200).json(result);
    } else {
      webhookLogger.warn({ result }, "Bounce handling failed");
      res.status(400).json(result);
    }
  } catch (error) {
    webhookLogger.error(
      { error: error.message, stack: error.stack },
      "Failed to handle bounce webhook"
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check endpoint for webhooks
 * GET /webhooks/health
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "webhooks" });
});

export default router;
