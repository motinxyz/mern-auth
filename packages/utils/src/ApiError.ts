/**
 * @class ApiError
 * @extends Error
 * @description A standardized error class for API responses.
 */
export interface ValidationError {
  field?: string;
  message?: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

export default class ApiError extends Error {
  public readonly statusCode: number;
  public readonly data: null;
  public readonly success: false;
  public readonly errors: ValidationError[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: ValidationError[] = [],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode || 500;
    this.data = null;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
