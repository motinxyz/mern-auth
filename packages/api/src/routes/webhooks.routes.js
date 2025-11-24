import express from "express";
import crypto from "crypto";
import { handleBounce } from "@auth/email";
import { config, logger } from "@auth/config";

const router = express.Router();
const webhookLogger = logger.child({ module: "webhooks" });

/**
 * Verify Resend webhook signature
 */
function verifyResendSignature(payload, signature, secret) {
  if (!secret) {
    webhookLogger.warn(
      "Resend webhook secret not configured - skipping verification"
    );
    return true; // Allow in development
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Webhook endpoint for Resend email events
 * POST /webhooks/resend
 *
 * Handles: email.bounced, email.complained, email.delivered
 */
router.post(
  "/resend",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      // Verify webhook signature
      const signature =
        req.headers["svix-signature"] || req.headers["resend-signature"];
      const webhookSecret = config.resendWebhookSecret;

      if (signature && webhookSecret) {
        const isValid = verifyResendSignature(
          req.body.toString(),
          signature,
          webhookSecret
        );

        if (!isValid) {
          webhookLogger.error("Invalid webhook signature");
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      // Parse the JSON body
      const event = JSON.parse(req.body.toString());
      webhookLogger.info({ event: event.type }, "Received Resend webhook");

      // Handle bounce events
      if (event.type === "email.bounced") {
        const bounceData = {
          email: event.data.to,
          messageId: event.data.email_id,
          bounceType: "hard", // Resend only sends hard bounces
          bounceReason: event.data.bounce?.message || "Unknown bounce reason",
          timestamp: new Date(event.created_at),
        };

        const result = await handleBounce(bounceData);

        webhookLogger.info(
          { result, email: bounceData.email },
          "Bounce handled - email marked for retry"
        );

        return res.status(200).json({ success: true, result });
      }

      // Handle complaint events (spam reports)
      if (event.type === "email.complained") {
        const bounceData = {
          email: event.data.to,
          messageId: event.data.email_id,
          bounceType: "complaint",
          bounceReason: "User marked email as spam",
          timestamp: new Date(event.created_at),
        };

        const result = await handleBounce(bounceData);

        webhookLogger.info(
          { result, email: bounceData.email },
          "Complaint handled"
        );
        return res.status(200).json({ success: true, result });
      }

      // Handle delivery confirmation
      if (event.type === "email.delivered") {
        webhookLogger.info(
          { email: event.data.to },
          "Email delivered successfully"
        );
        return res.status(200).json({ success: true });
      }

      // Unknown event type
      webhookLogger.warn({ type: event.type }, "Unknown webhook event type");
      return res
        .status(200)
        .json({ success: true, message: "Event type not handled" });
    } catch (error) {
      webhookLogger.error(
        { error: error.message, stack: error.stack },
        "Failed to handle Resend webhook"
      );
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * Health check endpoint for webhooks
 * GET /webhooks/health
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "webhooks" });
});

export default router;
