
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { ApiError, ValidationError, HTTP_STATUS_CODES } from '@auth/utils';

// Mock dependencies
vi.mock('@auth/config', () => ({
  logger: {
    child: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
    })),
  },
}));

vi.mock('@auth/utils', async () => {
  const actual = await vi.importActual('@auth/utils');
  return {
    ...actual,
    ValidationError: vi.fn().mockImplementation(function(errors, t) {
      this.errors = errors;
      this.statusCode = actual.HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;
      this.message = t ? t("validation:default") : "Validation Error";
      this.success = false;
    }),
  };
});

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      t: vi.fn((key) => key),
      body: {},
    };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
      headersSent: false,
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should handle ApiError correctly', () => {
    const error = new ApiError(HTTP_STATUS_CODES.NOT_FOUND, 'Not Found');
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not Found' }));
  });

      it('should handle ValidationError correctly', () => {
        const errors = [{ field: 'email', message: 'Invalid email' }];
        const mockT = vi.fn((key) => key);
        const error = new ValidationError(errors, mockT);
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
      });
  it('should convert Mongoose ValidationError to ApiError', () => {
    const mongooseError = {
      name: 'ValidationError',
      errors: {
        email: { path: 'email', message: 'Invalid email' },
      },
    };
    errorHandler(mongooseError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
  });

  it('should convert Mongoose DuplicateKeyError to ApiError', () => {
    const mongooseError = {
      name: 'MongoServerError',
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'test@example.com' },
    };
    errorHandler(mongooseError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.CONFLICT);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'validation:email.inUse' }));
  });

  it('should handle unexpected errors with a 500 status', () => {
    const error = new Error('Unexpected error');
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'system:process.errors.unexpected' }));
  });

  it('should not include sensitive fields in the response', () => {
    req.body = { password: '123456' };
    const errors = [{ field: 'password', message: 'Password is too short' }];
    const error = new ValidationError(errors);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBeUndefined();
  });

  it('should include oldValue for non-sensitive fields in the response', () => {
    req.body = { username: 'testuser' };
    const errors = [{ field: 'username', message: 'Username already taken' }];
    const error = new ValidationError(errors);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBe('testuser');
  });

  it('should not include oldValue if req.body is undefined', () => {
    req.body = undefined;
    const errors = [{ field: 'username', message: 'Username already taken' }];
    const error = new ValidationError(errors);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBeUndefined();
  });

  it('should not send response if headers have already been sent', () => {
    res.headersSent = true;
    const error = new Error('Test Error');
    errorHandler(error, req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
