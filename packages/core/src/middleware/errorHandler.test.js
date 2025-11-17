import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, ValidationError, HTTP_STATUS_CODES } from "@auth/utils";
import { createContainer, asValue } from 'awilix'; // Import Awilix utilities
import { errorHandlerFactory } from "./errorHandler.js"; // Import the errorHandlerFactory

// Mock @auth/utils - keep existing mocks
vi.mock("@auth/utils", async () => {
  const actual = await vi.importActual("@auth/utils");
  class MockValidationError extends Error {
    constructor(errors, t) {
      super(t ? t("validation:default") : "Validation Error");
      this.errors = errors;
      this.statusCode = actual.HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;
      this.success = false;
    }
  }
  return {
    ...actual,
    ValidationError: MockValidationError,
  };
});

describe("Error Handler Middleware", () => {
  let req, res, next;
  let errorHandler; // The resolved errorHandler middleware
  let mockLogger;
  let mockT;
  let mockWarnFn; // For the logger.warn mock
  let mockErrorFn; // For the logger.error mock

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks at the beginning

    // Create a fresh container for each test
    const container = createContainer();

    // Create mocks for logger methods
    mockWarnFn = vi.fn();
    mockErrorFn = vi.fn();

    // Mock logger.child to return an object with these mocks
    mockLogger = {
      child: vi.fn(() => ({
        error: mockErrorFn,
        warn: mockWarnFn,
      })),
    };

    // Mock t function
    mockT = vi.fn((key) => key);

    // Register mocks with the container
    container.register({
      logger: asValue(mockLogger),
      t: asValue(mockT),
      errorHandler: asValue(errorHandlerFactory({ logger: mockLogger, t: mockT })), // Registering the factory-created middleware
    });

    // Resolve errorHandler middleware from the container
    errorHandler = container.resolve('errorHandler');

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle ApiError correctly", () => {
    const error = new ApiError(HTTP_STATUS_CODES.NOT_FOUND, "Not Found");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        message: "Not Found"
      })
    );
     // Ensure logger was called correctly
    expect(mockLogger.child).toHaveBeenCalledWith({ module: "errorHandler" });
    expect(mockWarnFn).toHaveBeenCalledWith(
      expect.objectContaining({
        originalError: error,
        apiError: expect.any(ApiError),
      }),
      "A client error occurred"
    );
  });

  it("should handle ValidationError correctly", () => {
    const errors = [{ field: "email", message: "Invalid email" }];
    const mockReqT = vi.fn((key) => key); // Mock req.t for this specific test
    req.t = mockReqT; // Assign mock to req.t
    const error = new ValidationError(errors, mockReqT);
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
        errors: expect.any(Array)
      })
    );
    expect(mockWarnFn).toHaveBeenCalledWith(
      expect.objectContaining({
        originalError: error,
        apiError: expect.any(ValidationError),
      }),
      "A client error occurred"
    );
  });

  it("should convert Mongoose ValidationError to ApiError", () => {
    const mongooseError = {
      name: "ValidationError",
      errors: {
        email: { path: "email", message: "Invalid email" },
      },
    };
    errorHandler(mongooseError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
        errors: expect.any(Array)
      })
    );
    expect(mockWarnFn).toHaveBeenCalledWith(
      expect.objectContaining({
        originalError: mongooseError,
        apiError: expect.any(ValidationError),
      }),
      "A client error occurred"
    );
  });

  it("should convert Mongoose DuplicateKeyError to ApiError", async () => {
    const mongooseError = {
      name: "MongoServerError",
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: "test@example.com" },
    };
    errorHandler(mongooseError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.CONFLICT);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.CONFLICT, // Assert statusCode
        message: "validation:duplicateKeyError", // Updated message key
      })
    );
    expect(mockWarnFn).toHaveBeenCalledWith(
      expect.objectContaining({
        originalError: mongooseError,
        apiError: expect.any(ApiError),
      }),
      "A client error occurred"
    );
  });

  it("should handle unexpected errors with a 500 status", async () => {
    const error = new Error("Unexpected error");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: "system:process.errors.unexpected"
      })
    );
    expect(mockErrorFn).toHaveBeenCalledWith(
      expect.objectContaining({
        originalError: error,
        apiError: expect.any(ApiError),
      }),
      "An unexpected server error occurred"
    );
  });

  it("should not include sensitive fields in the response", () => {
    req.body = { password: "123456" };
    const errors = [{ field: "password", message: "Password is too short" }];
    const error = new ValidationError(errors, req.t);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBeUndefined();
  });

  it("should include oldValue for non-sensitive fields in the response", () => {
    req.body = { username: "testuser" };
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, req.t);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBe("testuser");
  });

  it("should not include oldValue if req.body is undefined", () => {
    req.body = undefined;
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, req.t);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBeUndefined();
  });

  it("should not include oldValue if field is not in req.body", () => {
    req.body = { otherField: "some value" };
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, req.t);
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].oldValue).toBeUndefined();
  });

  it("should not send response if headers have already been sent", () => {
    res.headersSent = true;
    const error = new Error("Test Error");
    errorHandler(error, req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
