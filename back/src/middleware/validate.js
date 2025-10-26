import { ZodError } from "zod";
import { ValidationError } from "../errors/index.js";
import logger from "../config/logger.js";

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
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const extractedErrors = error.issues.map((err) => {
        const field = err.path.slice(1).join("."); // e.g., 'body.name' -> 'name'
        let message = err.message;
        let context = {};

        // Try to parse the message as JSON. If it's not JSON, it's a simple string key.
        try {
          const parsed = JSON.parse(err.message);
          message = parsed.message;
          context = parsed.params || {};
        } catch (e) {
          // Not a JSON string, treat as a plain message key
        }

        return {
          field,
          message, // The translation key
          value: req.body[field], // Get the invalid value from the request body
          context, // Pass the context for i18n interpolation
        };
      });
      // Pass the structured error to the global error handler
      return next(new ValidationError(extractedErrors));
    }
    // Pass other errors down the chain
    return next(error);
  }
};

export default validate;
