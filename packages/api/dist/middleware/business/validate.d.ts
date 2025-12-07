import { type ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
/**
 * Middleware factory to validate requests against a Zod schema.
 * Works with pure Zod schemas (no body/query/params wrapper)
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
export declare const validate: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map