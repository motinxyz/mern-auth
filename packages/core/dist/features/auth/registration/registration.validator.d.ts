/**
 * Pure Zod schema for user registration
 * No Express middleware wrapping - just validation rules
 */
export declare const registrationSchema: import("zod").ZodObject<{
    name: import("zod").ZodString;
    email: import("zod").ZodString;
    password: import("zod").ZodString;
}, import("zod/v4/core").$strip>;
//# sourceMappingURL=registration.validator.d.ts.map