import { z } from "zod";
import { VALIDATION_RULES } from "@auth/utils";

/**
 * Zod schema for user registration.
 * It validates the request body.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "validation:name.required" })
      .min(VALIDATION_RULES.NAME.MIN_LENGTH, {
        message: "validation:name.length",
      }),
    email: z
      .string({ required_error: "validation:email.required" })
      .email({ message: "validation:email.invalid" }),
    password: z
      .string({ required_error: "validation:password.required" })
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, {
        message: "validation:password.length",
      }),
  }),
});

/**
 * Zod schema for email verification.
 * It validates the request query parameters.
 */
export const verifyEmailSchema = z.object({
  query: z.object({
    token: z
      .string({ required_error: "validation:token.required" })
      .min(1, { message: "validation:token.empty" }),
  }),
});