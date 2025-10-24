import { z } from "zod";
import { VALIDATION_RULES } from "../../constants/validation.constants.js";

/**
 * Zod schema for user registration.
 * It validates the request body.
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "validation:required.name" })
      .min(VALIDATION_RULES.NAME.MIN_LENGTH, {
        message: JSON.stringify({
          message: "validation:nameTooShort",
          params: { count: VALIDATION_RULES.NAME.MIN_LENGTH },
        }),
      }),
    email: z
      .string({ required_error: "validation:required.email" })
      .email({ message: "validation:invalidEmail" }),
    password: z
      .string({ required_error: "validation:required.email" })
      .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, {
        message: JSON.stringify({
          message: "validation:passwordTooShort",
          params: {
            count: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
          },
        }),
      }),
  }),
});
