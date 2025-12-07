/**
 * Authentication Validation Schemas
 *
 * Zod schemas for user authentication.
 * Uses VALIDATION_RULES for consistent enforcement.
 * Uses VALIDATION_MESSAGES for i18n keys.
 */
import { z } from "zod";
import { VALIDATION_RULES, VALIDATION_MESSAGES } from "../constants/validation.constants.js";
/**
 * Base schema for user registration fields.
 * This can be used on both frontend and backend.
 *
 * Error messages use i18n translation keys that will be translated
 * at the API response layer based on user's locale.
 */
export const registerUserSchema = z.object({
    name: z
        .string({ error: VALIDATION_MESSAGES.NAME.REQUIRED })
        .min(VALIDATION_RULES.NAME.MIN_LENGTH, {
        message: VALIDATION_MESSAGES.NAME.LENGTH,
    })
        .max(VALIDATION_RULES.NAME.MAX_LENGTH, {
        message: VALIDATION_MESSAGES.NAME.LENGTH,
    }),
    email: z
        .string({ error: VALIDATION_MESSAGES.EMAIL.REQUIRED })
        .regex(VALIDATION_RULES.EMAIL_REGEX, {
        message: VALIDATION_MESSAGES.EMAIL.INVALID,
    }),
    password: z
        .string({ error: VALIDATION_MESSAGES.PASSWORD.REQUIRED })
        .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, {
        message: VALIDATION_MESSAGES.PASSWORD.LENGTH,
    })
        .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH, {
        message: VALIDATION_MESSAGES.PASSWORD.LENGTH,
    }),
});
/**
 * Base schema for user login fields.
 */
export const loginUserSchema = z.object({
    email: z
        .string({ error: VALIDATION_MESSAGES.EMAIL.REQUIRED })
        .regex(VALIDATION_RULES.EMAIL_REGEX, {
        message: VALIDATION_MESSAGES.EMAIL.INVALID,
    }),
    password: z
        .string({ error: VALIDATION_MESSAGES.PASSWORD.REQUIRED })
        .min(1, { message: VALIDATION_MESSAGES.PASSWORD.REQUIRED }),
});
//# sourceMappingURL=auth.schemas.js.map