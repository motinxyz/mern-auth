import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerUser, verifyEmail } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { RegisterUserDto } from "./dtos/RegisterUserDto.js";
import { ApiResponse } from "@auth/utils";

// Mock dependencies
vi.mock("./auth.service.js", () => {
  const MockAuthService = vi.fn();
  MockAuthService.prototype.register = vi.fn();
  MockAuthService.prototype.verifyUserEmail = vi.fn();
  return { AuthService: MockAuthService };
});

vi.mock("./dtos/RegisterUserDto.js", () => ({
  RegisterUserDto: {
    fromRequest: vi.fn(),
  },
}));

vi.mock("@auth/utils", () => ({
  ApiResponse: vi.fn(),
  HTTP_STATUS_CODES: {
    CREATED: 201,
    OK: 200,
  },
}));

// Mock other dependencies imported by controller (indirectly or directly if needed)
vi.mock("@auth/database", () => ({ User: {} }));
vi.mock("@auth/config", () => ({ redisConnection: {}, config: {} }));
vi.mock("@auth/queues/producers", () => ({}));
vi.mock("../token/token.service.js", () => ({}));

describe("Auth Controller", () => {
  let req, res, next;
  let mockRegister;
  let mockVerifyUserEmail;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      t: vi.fn((key) => key),
    };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();

    // Get the mocked methods from the prototype
    mockRegister = AuthService.prototype.register;
    mockVerifyUserEmail = AuthService.prototype.verifyUserEmail;
  });

  describe("registerUser", () => {
    it("should register a user and return a 201 response", async () => {
      const userData = { name: "Test User", email: "test@example.com" };
      const dto = { ...userData };
      req.body = userData;

      RegisterUserDto.fromRequest.mockReturnValue(dto);
      mockRegister.mockResolvedValue(userData);

      await registerUser(req, res, next);

      expect(RegisterUserDto.fromRequest).toHaveBeenCalledWith(req);
      expect(mockRegister).toHaveBeenCalledWith(dto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(201, userData, "auth:register.success")
      );
    });

    it("should call next with an error if registration fails", async () => {
      const error = new Error("Registration failed");
      req.body = { name: "Test User", email: "test@example.com" };

      RegisterUserDto.fromRequest.mockReturnValue({});
      mockRegister.mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("verifyEmail", () => {
    it("should verify an email and return a 200 response", async () => {
      const token = "test_token";
      req.query = { token };
      const verificationResult = { status: "VERIFIED" };

      mockVerifyUserEmail.mockResolvedValue(verificationResult);

      await verifyEmail(req, res, next);

      expect(mockVerifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(200, verificationResult, "auth:verify.success")
      );
    });

    it("should call next with an error if email verification fails", async () => {
      const error = new Error("Verification failed");
      req.query = { token: "test_token" };

      mockVerifyUserEmail.mockRejectedValue(error);

      await verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should return ALREADY_VERIFIED status if email is already verified", async () => {
      const token = "test_token";
      req.query = { token };
      const verificationResult = { status: "ALREADY_VERIFIED" };

      mockVerifyUserEmail.mockResolvedValue(verificationResult);

      await verifyEmail(req, res, next);

      expect(mockVerifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(200, verificationResult, "auth:verify.alreadyVerified")
      );
    });
  });
});
