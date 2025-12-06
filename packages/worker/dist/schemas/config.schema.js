import { z } from "zod";
export const WorkerConfigSchema = z.object({
    concurrency: z.number().min(1).max(100).default(5),
    attempts: z.number().min(1).max(10).default(3),
    backoff: z
        .object({
        type: z.enum(["exponential", "linear", "fixed"]).default("exponential"),
        delay: z.number().min(100).max(60000).default(1000),
    })
        .default({ type: "exponential", delay: 1000 }),
    removeOnComplete: z
        .object({
        count: z.number().min(0).default(1000),
    })
        .default({ count: 1000 }),
    removeOnFail: z
        .object({
        count: z.number().min(0).default(5000),
    })
        .default({ count: 5000 }),
    stalledInterval: z.number().min(1000).optional().default(30000),
    lockDuration: z.number().min(1000).default(60000),
    drainDelay: z.number().min(0).default(500),
    disableStalledJobCheck: z.boolean().optional().default(false),
});
//# sourceMappingURL=config.schema.js.map