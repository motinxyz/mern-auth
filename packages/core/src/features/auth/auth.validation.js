import { z } from "zod";
import { registerUserSchema } from "@auth/utils";

/**
 * Zod schema for user registration.
 * It validates the request body by wrapping the shared schema.
 */
export const registerSchema = z.object({
  body: registerUserSchema,
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
