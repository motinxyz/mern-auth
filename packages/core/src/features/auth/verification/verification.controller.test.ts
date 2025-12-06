import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerificationController } from "./verification.controller.js";

vi.mock("@auth/utils", () => ({
  ApiResponse: class {
    constructor(statusCode, data, message) {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
    }
  },
  HTTP_STATUS_CODES: {
    CREATED: 201,
    OK: 200,
  },
}));

vi.mock("@auth/config", () => ({
  t: vi.fn((key) => key),
}));

describe("Verification Controller", () => {
  let verificationController;
  let mockVerificationService;

  beforeEach(() => {
    mockVerificationService = {
      verify: vi.fn(),
    };

    verificationController = new VerificationController(
      mockVerificationService
    );
    vi.clearAllMocks();
  });

  describe("verifyEmail", () => {
    it("should verify an email and return a 200 response", async () => {
      const token = "test_token";
      const dto = { token };
      const locale = "en";
      const verificationResult = { status: "VERIFIED" };

      mockVerificationService.verify.mockResolvedValue(verificationResult);

      const result = await verificationController.verifyEmail(dto, locale);

      expect(mockVerificationService.verify).toHaveBeenCalledWith(token);
      expect(result.statusCode).toBe(200);
      expect(result.data.data).toEqual(verificationResult);
    });

    it("should return ALREADY_VERIFIED status if email is already verified", async () => {
      const token = "test_token";
      const dto = { token };
      const locale = "en";
      const verificationResult = { status: "ALREADY_VERIFIED" };

      mockVerificationService.verify.mockResolvedValue(verificationResult);

      const result = await verificationController.verifyEmail(dto, locale);

      expect(mockVerificationService.verify).toHaveBeenCalledWith(token);
      expect(result.statusCode).toBe(200);
      expect(result.data.data).toEqual(verificationResult);
    });
  });
});
