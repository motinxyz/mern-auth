import { z } from "zod";

/**
 * Email Job Data Schema
 * Validates job data structure for email queue
 */
export const EmailJobDataSchema = z.object({
  user: z.object({
    id: z.string().or(z.number()),
    email: z.string().email(),
    name: z.string().optional(),
  }),
  token: z.string().min(1),
  locale: z.string().default("en"),
  template: z.string().optional(),
});

/**
 * Generic Job Data Schema
 * Base schema for all job types
 */
export const BaseJobDataSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()),
});
