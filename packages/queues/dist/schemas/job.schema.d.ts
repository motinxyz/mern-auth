import { z } from "zod";
/**
 * Email Job Data Schema
 * Validates job data structure for email queue
 */
export declare const EmailJobDataSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        email: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    token: z.ZodString;
    locale: z.ZodDefault<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Generic Job Data Schema
 * Base schema for all job types
 */
export declare const BaseJobDataSchema: z.ZodObject<{
    type: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>;
//# sourceMappingURL=job.schema.d.ts.map