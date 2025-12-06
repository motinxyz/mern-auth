/**
 * Middleware factory to validate requests against a Zod schema.
 * Works with pure Zod schemas (no body/query/params wrapper)
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
export declare const validate: (schema: any) => (req: any, res: any, next: any) => Promise<any>;
//# sourceMappingURL=validate.d.ts.map