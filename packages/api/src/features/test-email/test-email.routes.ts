import { Router } from "express";
import { z } from "zod";
import { getEmailService } from "@auth/app-bootstrap";
import { getLogger } from "@auth/config";
import { validate } from "../../middleware/index.js";

const logger = getLogger();

const router = Router();
const testLogger = logger.child({ module: "test-email" });

/**
 * Zod schema for test email request
 */
const testEmailSchema = z.object({
  body: z.object({
    to: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Subject is required").optional(),
  }),
});

/**
 * Test endpoint to send a simple email using the test template
 * POST /test-email
 *
 * Uses the verification email template for testing purposes.
 */
router.post("/test-email", validate(testEmailSchema), async (req, res) => {
  try {
    const { to, subject } = req.body as { to: string; subject?: string };

    testLogger.info({ to, subject }, "Sending test email");

    const emailService = getEmailService();
    const result = await emailService.sendEmail({
      to,
      template: "verification",
      data: {
        name: "Test User",
        verificationUrl: "https://example.com/verify/test-token",
        expiresInHours: 24,
        isTest: true,
      },
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testLogger.error({ error: errorMessage }, "Error sending test email");
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
