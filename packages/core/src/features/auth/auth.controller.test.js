import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthController } from "./auth.controller.js";
import { RegisterUserDto } from "./dtos/RegisterUserDto.js";
import { ApiResponse } from "@auth/utils";

// Mock dependencies
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

describe("Auth Controller", () => {
  let authController;
  let mockAuthService;
  let req, res, next;

  beforeEach(() => {
    // Create a mock AuthService
    mockAuthService = {
      register: vi.fn(),
      verifyUserEmail: vi.fn(),
    };

    // Instantiate AuthController with the mock service
    authController = new AuthController(mockAuthService);

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
  });

  describe("registerUser", () => {
    it("should register a user and return a 201 response", async () => {
      const userData = { name: "Test User", email: "test@example.com" };
      const dto = { ...userData };
      req.body = userData;

      RegisterUserDto.fromRequest.mockReturnValue(dto);
      mockAuthService.register.mockResolvedValue(userData);

      await authController.registerUser(req, res, next);

      expect(RegisterUserDto.fromRequest).toHaveBeenCalledWith(req);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(201, userData, "auth:register.success")
      );
    });

    it("should call next with an error if registration fails", async () => {
      const error = new Error("Registration failed");
      req.body = { name: "Test User", email: "test@example.com" };

      RegisterUserDto.fromRequest.mockReturnValue({});
      mockAuthService.register.mockRejectedValue(error);

      await authController.registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("verifyEmail", () => {
    it("should verify an email and return a 200 response", async () => {
      const token = "test_token";
      req.query = { token };
      const verificationResult = { status: "VERIFIED" };

      mockAuthService.verifyUserEmail.mockResolvedValue(verificationResult);

      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(200, verificationResult, "auth:verify.success")
      );
    });

    it("should call next with an error if email verification fails", async () => {
      const error = new Error("Verification failed");
      req.query = { token: "test_token" };

      mockAuthService.verifyUserEmail.mockRejectedValue(error);

      await authController.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should return ALREADY_VERIFIED status if email is already verified", async () => {
      const token = "test_token";
      req.query = { token };
      const verificationResult = { status: "ALREADY_VERIFIED" };

      mockAuthService.verifyUserEmail.mockResolvedValue(verificationResult);

      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(200, verificationResult, "auth:verify.alreadyVerified")
      );
    });
  });
});
