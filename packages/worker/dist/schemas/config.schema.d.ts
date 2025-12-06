import { z } from "zod";
export declare const WorkerConfigSchema: z.ZodObject<{
    concurrency: z.ZodDefault<z.ZodNumber>;
    attempts: z.ZodDefault<z.ZodNumber>;
    backoff: z.ZodDefault<z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<{
            exponential: "exponential";
            linear: "linear";
            fixed: "fixed";
        }>>;
        delay: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    removeOnComplete: z.ZodDefault<z.ZodObject<{
        count: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    removeOnFail: z.ZodDefault<z.ZodObject<{
        count: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    stalledInterval: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    lockDuration: z.ZodDefault<z.ZodNumber>;
    drainDelay: z.ZodDefault<z.ZodNumber>;
    disableStalledJobCheck: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
//# sourceMappingURL=config.schema.d.ts.map