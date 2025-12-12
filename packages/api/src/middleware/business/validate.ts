import { ZodError, type ZodSchema } from "zod";
// import { getLogger } from "@auth/app-bootstrap";
import type { Request, Response, NextFunction } from "express";

// const _logger = getLogger();
import { ValidationError } from "@auth/utils";

/**
 * Middleware factory to validate requests against a Zod schema.
 * Works with pure Zod schemas (no body/query/params wrapper)
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
export const validate = (schema: ZodSchema) => async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Determine what to validate based on HTTP method
    const dataToValidate = req.method === "GET" ? req.query : req.body;

    // Validate with pure schema
    const validated = await schema.parseAsync(dataToValidate);

    // Replace request data with validated data
    if (req.method === "GET") {
      req.query = validated as typeof req.query;
    } else {
      req.body = validated;
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const extractedErrors = error.issues.map((err) => {
        // For pure schemas, path is direct (e.g., ['name'] not ['body', 'name'])
        const field = err.path.join(".");
        const context = {};
        if (err.code === "too_small") {
          (context as Record<string, unknown>).count = err.minimum;
        }

        return {
          field,
          message: err.message, // The translation key from the schema
          context, // Pass the context for i18n interpolation
        };
      });
      // Pass the structured error to the global error handler
      return next(new ValidationError(extractedErrors, "validation:failed"));
    }
    // Pass other errors down the chain
    return next(error);
  }
};
