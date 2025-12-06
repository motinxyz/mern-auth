import { registerUserSchema as baseRegisterSchema } from "@auth/utils";

/**
 * Pure Zod schema for user registration
 * No Express middleware wrapping - just validation rules
 */
export const registrationSchema = baseRegisterSchema;
