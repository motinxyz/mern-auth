
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from './validate.js';
import { ValidationError } from '@auth/utils';

// Mock dependencies
vi.mock('@auth/config', () => ({
  logger: {
    child: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
    })),
  },
  t: vi.fn((key) => key),
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

describe('Validate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {};
    next = vi.fn();
    vi.clearAllMocks();
  });

  const testSchema = z.object({
    body: z.object({
      name: z.string().min(3),
    }),
  });

  it('should call next if validation passes', async () => {
    req.body.name = 'Valid Name';
    const middleware = validate(testSchema);
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with a ValidationError if validation fails', async () => {
    req.body.name = 'a'; // Invalid name
    const middleware = validate(testSchema);
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should extract correct error details from ZodError', async () => {
    req.body.name = 'a'; // Invalid name
    const middleware = validate(testSchema);
    await middleware(req, res, next);
    const validationError = next.mock.calls[0][0];
    expect(validationError.errors).toEqual([
      {
        field: 'name',
        message: expect.any(String),
        context: { count: 3 },
      },
    ]);
  });

  it('should extract correct error details from ZodError with nested path', async () => {
    const nestedSchema = z.object({
      body: z.object({
        user: z.object({
          name: z.string().min(3),
        }),
      }),
    });
    req.body = { user: { name: 'a' } }; // Invalid nested name
    const middleware = validate(nestedSchema);
    await middleware(req, res, next);
    const validationError = next.mock.calls[0][0];
    expect(validationError.errors).toEqual([
      {
        field: 'user.name',
        message: expect.any(String),
        context: { count: 3 },
      },
    ]);
  });

  it('should call next with the original error if it is not a ZodError', async () => {
    const originalError = new Error('Something unexpected happened');
    const schemaWithThrow = z.object({
      body: z.string().transform(() => { throw originalError; }),
    });
    req.body = 'some string';
    const middleware = validate(schemaWithThrow);
    await middleware(req, res, next);
    expect(next).toHaveBeenCalledWith(originalError);
  });
});
