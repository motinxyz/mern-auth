import { z } from "zod";
import { VALIDATION_RULES } from "../constants/validation.constants.js";

/**
 * Base schema for user registration fields.
 * This can be used on both frontend and backend.
 *
 * Error messages use i18n translation keys that will be translated
 * at the API response layer based on user's locale.
 */
export const registerUserSchema = z.object({
  name: z
    .string({ error: "validation:name.required" })
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, {
      message: "validation:name.length",
    }),
  email: z
    .string({ error: "validation:email.required" })
    .regex(VALIDATION_RULES.EMAIL_REGEX, {
      message: "validation:email.invalid",
    }),
  password: z
    .string({ error: "validation:password.required" })
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, {
      message: "validation:password.length",
    }),
});

/**
 * Base schema for user login fields.
 */
export const loginUserSchema = z.object({
  email: z
    .string({ error: "validation:email.required" })
    .regex(VALIDATION_RULES.EMAIL_REGEX, {
      message: "validation:email.invalid",
    }),
  password: z
    .string({ error: "validation:password.required" })
    .min(1, { message: "validation:password.required" }),
});
