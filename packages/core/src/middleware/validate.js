import { ZodError } from "zod";
import { logger, t } from "@auth/config";
import { ValidationError } from "@auth/utils";


/**
 * Middleware factory to validate requests against a Zod schema.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const extractedErrors = error.issues.map((err) => {
        // Zod's err.path is an array (e.g., ['body', 'name']). We want 'name'.
        const field = err.path.slice(1).join("."); 
        const context = {};
        if (err.code === "too_small") {
          context.count = err.minimum;
        }

        return {
          field,
          message: err.message, // The translation key from the schema
          context, // Pass the context for i18n interpolation
        };
      });
      // Pass the structured error to the global error handler
      return next(new ValidationError(extractedErrors, req.t));
    }
    // Pass other errors down the chain
    return next(error);
  }
};

export default validate;
