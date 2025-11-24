import express from "express";
import { sendEmail } from "@auth/email";
import { logger } from "@auth/config";

const router = express.Router();
const testLogger = logger.child({ module: "test-email" });

/**
 * Test endpoint to send a simple plain text email
 * GET /test-email?to=email@example.com
 */
router.get("/", async (req, res) => {
  try {
    const { to } = req.query;

    if (!to) {
      return res.status(400).json({ error: "Missing 'to' query parameter" });
    }

    testLogger.info({ to }, "Sending test email");

    // Send plain text email using existing email service
    const result = await sendEmail({
      to,
      subject: "Test Email - Plain Text Only",
      text: "This is a simple test email with no HTML, no links, and no styling.",
      html: "<p>This is a simple test email with no HTML, no links, and no styling.</p>",
      type: "test",
      metadata: { isTest: true },
    });

    testLogger.info(
      { messageId: result.messageId },
      "Test email sent successfully"
    );

    res.json({
      success: true,
      messageId: result.messageId,
      emailLogId: result.emailLogId,
      message: "Test email sent successfully",
    });
  } catch (error) {
    testLogger.error({ error: error.message }, "Error sending test email");
    res.status(500).json({ error: error.message });
  }
});

export default router;
