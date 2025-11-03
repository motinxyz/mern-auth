// This file tells the TypeScript language server (used by VS Code for intellisense)
// what is exported from your local @auth/core package.
declare module '@auth/config' {
  export const config: any;
  export const logger: any;
  export const systemT: any;
  export const i18nInstance: any;
  export const i18nMiddleware: any;
}

declare module '@auth/utils' {
  export * from './constants/httpStatusCodes';
  export * from './constants/validation.constants';
  export * from './constants/auth.constants';
  export * from './constants/token.constants';
  export class ApiError extends Error {
    constructor(statusCode: number, message: string, errors?: any[], isOperational?: boolean, stack?: string);
  }
  export class ApiResponse {
    constructor(statusCode: number, data: any, message: string);
  }
  export class BadRequestError extends ApiError {}
  export class ConflictError extends ApiError {}
  export class EnvironmentError extends Error {}
  export class ForbiddenError extends ApiError {}
  export class InvalidJobDataError extends Error {}
  export class NotFoundError extends ApiError {}
  export class RedisConnectionError extends Error {}
  export class TooManyRequestsError extends ApiError {}
  export class UnauthorizedError extends ApiError {}
  export class UnknownJobTypeError extends ApiError {}
  export class ValidationError extends ApiError {}
  export const HASHING_ALGORITHM: string;
}

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