declare module "@auth/utils" {
  export class ApiResponse {
    statusCode: number;
    data: object;
    message: string;
    success: boolean;
    constructor(statusCode: number, data: object, message?: string);
  }

  export class ApiError extends Error {
    statusCode: number;
    data: null;
    message: string;
    success: boolean;
    errors: any[];
    constructor(statusCode: number, message?: string, errors?: any[], stack?: string);
  }

  export class ValidationError extends ApiError { }
  export class NotFoundError extends ApiError { }
  export class ConflictError extends ApiError { }
  export class TooManyRequestsError extends ApiError { }
  export class EnvironmentError extends ApiError { }
  export class UnknownJobTypeError extends ApiError { }
  export class InvalidJobDataError extends ApiError { }
  export class EmailDispatchError extends ApiError { }
  export class JobCreationError extends ApiError { }
  export class TokenCreationError extends ApiError { }
  export class RedisConnectionError extends ApiError { }
  export class QueueError extends ApiError { }
  export class ServiceUnavailableError extends ApiError { }

  export const HTTP_STATUS_CODES: {
    OK: 200;
    CREATED: 201;
    BAD_REQUEST: 400;
    UNAUTHORIZED: 401;
    FORBIDDEN: 403;
    NOT_FOUND: 404;
    CONFLICT: 409;
    UNPROCESSABLE_CONTENT: 422;
    TOO_MANY_REQUESTS: 429;
    INTERNAL_SERVER_ERROR: 500;
    SERVICE_UNAVAILABLE: 503;
  };

  export const VALIDATION_RULES: {
    NAME: {
      MIN_LENGTH: number;
    };
    PASSWORD: {
      MIN_LENGTH: number;
    };
    EMAIL_REGEX: RegExp;
  };

  export const VERIFICATION_STATUS: {
    VERIFIED: "VERIFIED";
    ALREADY_VERIFIED: "ALREADY_VERIFIED";
  };

  export const RATE_LIMIT_DURATIONS: {
    VERIFY_EMAIL: number;
  };

  export const REDIS_RATE_LIMIT_VALUE: string;

  export function createAuthRateLimitKey(prefix: string, email: string): string;
  export function createVerifyEmailKey(prefix: string, hashedToken: string): string;

  export function normalizeEmail(email: string): string;
  export function areEmailsEquivalent(email1: string, email2: string): boolean;

  export const registerUserSchema: any;
  export const loginUserSchema: any;
}
