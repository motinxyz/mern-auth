import { ZodError } from "zod";
import { ValidationError } from "../errors/index.js";
import logger from "../config/logger.js";

/**
 * Safely gets a nested property from an object.
 * @param {object} obj The object to query.
 * @param {string} path The dot-separated path to the property.
 * @returns {any} The value at the path, or undefined if not found.
 */
const getNestedValue = (obj, path) =>
  path.split(".").reduce((acc, part) => acc && acc[part], obj);

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
          // Combine params from schema with the invalid value
          context = {
            ...parsed.params,
            value: getNestedValue(req.body, field),
          };
        } catch (e) {
          // Not a JSON string, treat as a plain message key
        }

        return {
          field,
          message, // The translation key
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
