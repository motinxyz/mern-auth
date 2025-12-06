import { Router } from "express";
import { validate } from "../../middleware/index.js";
import { verificationSchema } from "@auth/core";
import { authLimiter } from "../../middleware/index.js";
import { authController } from "./auth.adapter.instance.js";
import { AUTH_ROUTES } from "@auth/utils";
const router = Router();
/**
 * @openapi
 * /v1/auth/verify-email:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify user's email address
 *     description: Verifies a user's email address using a token sent to their email.
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verification token.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       404:
 *         description: Invalid or expired token
 */
router.get(AUTH_ROUTES.VERIFY_EMAIL, validate(verificationSchema), authController.verifyEmail);
export default router;
//# sourceMappingURL=verification.routes.js.map