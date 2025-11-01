// This file tells the TypeScript language server (used by VS Code for intellisense)
// what is exported from your local @auth/core package.
declare module '@auth/core' {
  // You can be as specific or as general as you want here.
  // For now, let's just export 'any' to fix the errors and get you running.
  // We can make this more specific later if needed.
  export const config: any;
  export const logger: any;
  export function getTranslator(locale: string): Promise<(key: string, options?: any) => string>;
  export * from './constants/httpStatusCodes';
  export * from './constants/validation.constants';
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
  export class UnknownJobTypeError extends Error {}
  export class ValidationError extends ApiError {}
  export function errorHandler(err: any, req: any, res: any, next: any): void;
  export const redisClient: any;
  export const EMAIL_JOB_TYPES: any;
  export const QUEUE_NAMES: any;
  export function addEmailJob(jobName: string, data: any): Promise<any>;
  export const HASHING_ALGORITHM: string;
  export const TOKEN_REDIS_PREFIXES: any;
  export function createVerificationToken(user: any): Promise<string>;
  export const authLimiter: any;
  export const validate: any;
}