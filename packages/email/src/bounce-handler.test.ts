import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBounce, isEmailValid } from "./bounce-handler.js";

describe("Bounce Handler", () => {
  let mockEmailLogRepository;
  let mockUserRepository;
  let mockLogger;
  let mockT;

  beforeEach(() => {
    mockEmailLogRepository = {
      recordBounce: vi.fn(),
    };
    mockUserRepository = {
      findByEmail: vi.fn(),
    };
    mockLogger = {
      child: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    };
    mockT = vi.fn((key) => key);
  });

  describe("handleBounce", () => {
    const baseBounceData = {
      email: "test@example.com",
      messageId: "msg-123",
      timestamp: new Date(),
    };

    it("should return failure if email log is not found", async () => {
      mockEmailLogRepository.recordBounce.mockResolvedValue(null);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "hard" }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Email log not found");
      expect(mockEmailLogRepository.recordBounce).toHaveBeenCalledWith(
        "msg-123",
        expect.objectContaining({
          bounceType: "hard",
        })
      );
    });

    it("should handle hard bounce from Resend (retry via SMTP)", async () => {
      const emailLog = { provider: "resend-api" };
      mockEmailLogRepository.recordBounce.mockResolvedValue(emailLog);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "hard", bounceReason: "Failed" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("retry_alternate_provider");
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("should handle hard bounce from other provider (mark invalid)", async () => {
      mockEmailLogRepository.recordBounce.mockResolvedValue({
        userId: "user-123",
        provider: "mailersend",
      });
      mockUserRepository.findByEmail.mockResolvedValue({
        _id: "user-123",
      });

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        {
          email: "user@example.com",
          messageId: "msg-123",
          bounceType: "hard",
          bounceReason: "Invalid email",
          timestamp: new Date(),
        }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("marked_invalid");
      // Note: The implementation does not update user in this case, only logs
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("user@example.com");
    });

    it("should handle soft bounce (retry later)", async () => {
      mockEmailLogRepository.recordBounce.mockResolvedValue({
        userId: "user-123",
        provider: "mailersend",
      });

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        {
          email: "user@example.com",
          messageId: "msg-123",
          bounceType: "soft",
          bounceReason: "Full inbox",
          timestamp: new Date(),
        }
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe("retry_alternate_provider");
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("should handle complaint (unsubscribe)", async () => {
      const emailLog = { provider: "smtp" };
      mockEmailLogRepository.recordBounce.mockResolvedValue(emailLog);
      mockUserRepository.findByEmail.mockResolvedValue({
        _id: "user-123",
      });

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "complaint" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("unsubscribed");
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should handle unknown bounce type (log only)", async () => {
      const emailLog = { provider: "smtp" };
      mockEmailLogRepository.recordBounce.mockResolvedValue(emailLog);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "unknown" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("logged");
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe("isEmailValid", () => {
    it("should return true for valid email", () => {
      expect(isEmailValid("test@example.com")).toBe(true);
    });

    it("should return false for invalid email", () => {
      expect(isEmailValid("invalid-email")).toBe(false);
      expect(isEmailValid("test@")).toBe(false);
      expect(isEmailValid("@example.com")).toBe(false);
      expect(isEmailValid("test example.com")).toBe(false);
    });
  });
});
