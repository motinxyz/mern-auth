import { Router } from "express";
import { authController } from "./auth.container.js";
import { validate } from "../../middleware/validate.js";
import { registerSchema, verifyEmailSchema } from "./auth.validation.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { AUTH_ROUTES } from "@auth/utils";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account with the provided name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       422:
 *         description: Validation error (e.g., invalid email, weak password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Conflict - A user with the given email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests from this IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  AUTH_ROUTES.REGISTER,
  authLimiter,
  validate(registerSchema),
  authController.registerUser.bind(authController)
);

/**
 * @openapi
 * /auth/verify-email:
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Not Found - The token is invalid or has expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  AUTH_ROUTES.VERIFY_EMAIL,
  validate(verifyEmailSchema),
  authController.verifyEmail.bind(authController)
);

export default router;
