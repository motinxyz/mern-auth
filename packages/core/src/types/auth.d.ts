// This file tells the TypeScript language server (used by VS Code for intellisense)
// what is exported from your local @auth/core package.

declare module '@auth/database' {
  export { default } from 'mongoose';
  export * from './models/user.model';
  export function connectDB(): Promise<void>;
  export function disconnectDB(): Promise<void>;
}

declare module '@auth/queues' {
  export const redisConnection: any;
  export const emailQueue: any;
  export const QUEUE_NAMES: any;
  export const EMAIL_JOB_TYPES: any;
  export function addEmailJob(jobName: string, data: any): Promise<any>;
}

declare module '@auth/worker' {
  export const emailWorker: any;
}

declare module '@auth/core' {
  export function createVerificationToken(user: any): Promise<string>;
  export function errorHandler(err: any, req: any, res: any, next: any): void;
  export function setupMiddleware(app: any): void;
  export const authLimiter: any;
  export const validate: any;
}