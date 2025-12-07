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
        text: z.string().optional(),
        html: z.string().optional(),
    }),
});
/**
 * Test endpoint to send a simple plain text email
 * POST /test-email
 */
router.post("/test-email", validate(testEmailSchema), async (req, res) => {
    try {
        const { to, subject, text: _text, html: _html } = req.body;
        testLogger.info({ to, subject }, "Sending test email");
        const emailService = getEmailService();
        const result = await emailService.sendEmail({
            to,
            metadata: { isTest: true },
        });
        testLogger.info({ messageId: result.messageId }, "Test email sent successfully");
        res.json({
            success: true,
            messageId: result.messageId,
            emailLogId: result.emailLogId,
            message: "Test email sent successfully",
        });
    }
    catch (error) {
        testLogger.error({ error: error.message }, "Error sending test email");
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=test-email.routes.js.map