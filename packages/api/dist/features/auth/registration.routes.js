import { Router } from "express";
import { validate } from "../../middleware/index.js";
import { registrationSchema } from "@auth/core";
import { authLimiter } from "../../middleware/index.js";
import { authController } from "./auth.adapter.instance.js";
import { AUTH_ROUTES } from "@auth/utils";
const router = Router();
/**
 * @openapi
 * /v1/auth/register:
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
 *       422:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       429:
 *         description: Too many requests
 */
router.post(AUTH_ROUTES.REGISTER, authLimiter, validate(registrationSchema), authController.register);
export default router;
//# sourceMappingURL=registration.routes.js.map