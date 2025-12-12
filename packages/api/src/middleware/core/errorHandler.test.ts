
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError, ValidationError, HTTP_STATUS_CODES } from "@auth/utils";

// Mock dependencies
vi.mock("@auth/app-bootstrap", () => ({
  getLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
    })),
  })),
}));

vi.mock("@auth/utils", async () => {
  const actual = await vi.importActual("@auth/utils");
  class MockValidationError extends Error {
    errors: any;
    statusCode: any;
    success: boolean;
    constructor(errors: any, message: any) {
      super(message || "Validation Error");
      this.errors = errors;
      this.statusCode = (actual.HTTP_STATUS_CODES as any).UNPROCESSABLE_CONTENT ?? 422;
      this.success = false;
    }
  }
  return {
    ...actual,
    ValidationError: MockValidationError,
  };
});

describe("Error Handler Middleware", () => {
  let req: any, res: any, next: any;
  let errorHandler: any; // Declare errorHandler here with let
  let mockErrorFn: any; // Declare mockErrorFn here

  beforeEach(async () => {
    vi.clearAllMocks(); // Clear mocks at the beginning
    vi.resetModules(); // Reset module registry to ensure a fresh import

    // Use vi.doMock to re-mock @auth/app-bootstrap after vi.resetModules()
    await vi.doMock("@auth/app-bootstrap", () => ({
      getLogger: vi.fn(() => ({
        child: vi.fn(() => ({
          error: (mockErrorFn = vi.fn()), // Assign the mock function to mockErrorFn
          warn: vi.fn(),
        })),
      })),
    }));

    // Re-import errorHandler after resetting modules and re-mocking config
    const reimportedModule = await import("./errorHandler.js");
    errorHandler = reimportedModule.errorHandler;

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

  it("should handle HttpError correctly", () => {
    const error = new HttpError(HTTP_STATUS_CODES.NOT_FOUND, "Not Found");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.NOT_FOUND,
        message: "Not Found",
      })
    );
  });

  it("should handle ValidationError correctly", () => {
    const errors = [{ field: "email", message: "Invalid email" }];

    const error = new ValidationError(errors, "validation:failed");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT,
        errors: expect.any(Array),
      })
    );
  });

  it("should convert Mongoose ValidationError to HttpError", () => {
    const mongooseError = {
      name: "ValidationError",
      errors: {
        email: { path: "email", message: "Invalid email" },
      },
    };
    errorHandler(mongooseError, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT,
        errors: expect.any(Array),
      })
    );
  });

  it("should convert Mongoose DuplicateKeyError to ConflictError", () => {
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
        success: false,
        statusCode: HTTP_STATUS_CODES.CONFLICT,
        message: req.t("auth:errors.duplicateKey"),
        errors: [
          {
            field: "email",
            message: req.t("validation:duplicateValue"),
          },
        ],
      })
    );
  });

  it("should handle unexpected errors with a 500 status", async () => {
    // Mark test as async
    const error = new Error("Unexpected error");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: "system:process.errors.unexpected",
      })
    );
    expect(mockErrorFn).toHaveBeenCalled(); // Assert that error was logged using the captured mock
  });

  it("should not include sensitive fields in the response", () => {
    req.body = { password: "123456" };
    const errors = [{ field: "password", message: "Password is too short" }];
    const error = new ValidationError(errors, "validation:failed");
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].field).toBe("password");
  });

  it("should include oldValue for non-sensitive fields in the response", () => {
    req.body = { username: "testuser" };
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, "validation:failed");
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].field).toBe("username");
  });

  it("should not include oldValue if req.body is undefined", () => {
    req.body = undefined;
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, "validation:failed");
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].field).toBe("username");
  });

  it("should not include oldValue if field is not in req.body", () => {
    req.body = { otherField: "some value" };
    const errors = [{ field: "username", message: "Username already taken" }];
    const error = new ValidationError(errors, "validation:failed");
    errorHandler(error, req, res, next);
    const response = res.json.mock.calls[0][0];
    expect(response.errors[0].field).toBe("username");
  });

  it("should not send response if headers have already been sent", () => {
    res.headersSent = true;
    const error = new Error("Test Error");
    errorHandler(error, req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
