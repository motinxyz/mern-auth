import { z } from "zod";
/**
 * Base schema for user registration fields.
 * This can be used on both frontend and backend.
 *
 * Error messages use i18n translation keys that will be translated
 * at the API response layer based on user's locale.
 */
export declare const registerUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
/**
 * Base schema for user login fields.
 */
export declare const loginUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=auth.schemas.d.ts.map