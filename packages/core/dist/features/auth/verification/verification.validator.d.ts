import { z } from "zod";
/**
 * Pure Zod schema for email verification
 * No Express middleware wrapping - just validation rules
 */
export declare const verificationSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=verification.validator.d.ts.map