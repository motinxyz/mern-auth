import { z } from "zod";

/**
 * Pure Zod schema for email verification
 * No Express middleware wrapping - just validation rules
 */
export const verificationSchema = z.object({
  token: z
    .string({ required_error: "validation:token.required" })
    .min(1, { message: "validation:token.empty" }),
});
