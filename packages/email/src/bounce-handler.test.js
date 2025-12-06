import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBounce, isEmailValid } from "./bounce-handler.js";

describe("Bounce Handler", () => {
  let mockEmailLogRepository;
  let mockUserRepository;
  let mockLogger;
  let mockT;

  beforeEach(() => {
    mockEmailLogRepository = {
      findOneAndUpdate: vi.fn(),
    };
    mockUserRepository = {
      findOneAndUpdate: vi.fn(),
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
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue(null);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "hard" }
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Email log not found");
      expect(mockEmailLogRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { messageId: "msg-123" },
        expect.objectContaining({
          status: "bounced",
          bounceType: "hard",
        })
      );
    });

    it("should handle hard bounce from Resend (retry via SMTP)", async () => {
      const emailLog = { provider: "resend-api" };
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue(emailLog);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "hard", bounceReason: "Failed" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("retry_alternate_provider");
      expect(mockUserRepository.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle hard bounce from other provider (mark invalid)", async () => {
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue({
        userId: "user-123",
        provider: "mailersend",
      });
      mockUserRepository.findOneAndUpdate.mockResolvedValue({
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
      expect(mockUserRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: "user@example.com" },
        expect.objectContaining({
          emailValid: false,
        })
      );
    });

    it("should handle soft bounce (retry later)", async () => {
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue({
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
      expect(mockUserRepository.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle complaint (unsubscribe)", async () => {
      const emailLog = { provider: "smtp" };
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue(emailLog);
      mockUserRepository.findOneAndUpdate.mockResolvedValue({
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
      expect(mockUserRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: "test@example.com" },
        expect.objectContaining({
          emailValid: false,
          emailComplaintReceived: true,
        })
      );
    });

    it("should handle unknown bounce type (log only)", async () => {
      const emailLog = { provider: "smtp" };
      mockEmailLogRepository.findOneAndUpdate.mockResolvedValue(emailLog);

      const result = await handleBounce(
        mockEmailLogRepository,
        mockUserRepository,
        mockLogger,
        mockT,
        { ...baseBounceData, bounceType: "unknown" }
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe("logged");
      expect(mockUserRepository.findOneAndUpdate).not.toHaveBeenCalled();
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
