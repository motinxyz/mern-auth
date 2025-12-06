import { z } from "zod";
/**
 * Pure Zod schema for email verification
 * No Express middleware wrapping - just validation rules
 */
export const verificationSchema = z.object({
    token: z
        .string()
        .min(1, { message: "validation:token.required" }),
});
//# sourceMappingURL=verification.validator.js.map