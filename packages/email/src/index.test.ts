import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmailService } from "./index.js";
import { EmailDispatchError, createCircuitBreaker } from "@auth/utils";

// Mock external dependencies
vi.mock("@auth/utils", async () => {
  const actual = await vi.importActual<any>("@auth/utils");
  return {
    ...actual,
    addSpanAttributes: vi.fn(),
    withSpan: vi.fn((...args) => {
      const fn = args.find((arg) => typeof arg === "function");
      if (fn) return fn();
      return Promise.resolve();
    }),
    createCircuitBreaker: vi.fn(),
  };
});

vi.mock("opossum", () => {
  return {
    default: vi.fn(),
  };
});

vi.mock("@auth/config", () => ({
  i18nInstance: {
    getFixedT: vi.fn().mockResolvedValue((key) => key),
  },
  config: {
    emailFrom: "test@example.com",
    env: "test",
  },
  getLogger: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  // Mock metrics
  emailSendTotal: {
    add: vi.fn(),
  },
  emailSendDuration: {
    record: vi.fn(),
  },
  updateEmailMetrics: vi.fn(),
}));

describe("Email Service", () => {
  let emailService;
  let mockConfig;
  let mockLogger;
  let mockT;
  let mockEmailLogRepository;
  let mockProviderService;
  let mockCircuitBreakerInstance;
  let mockBreakerFire;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock dependencies
    mockConfig = {
      emailFrom: "test@example.com",
      env: "test",
    };

    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    mockT = vi.fn((key) => key);

    mockEmailLogRepository = {
      create: vi.fn().mockResolvedValue({ _id: "log-123" }),
      updateById: vi.fn().mockResolvedValue(true),
      updateStatus: vi.fn().mockResolvedValue(true),
    };

    // Create mock provider service (injected via DI)
    mockProviderService = {
      initialize: vi.fn().mockResolvedValue(),
      sendWithFailover: vi.fn(),
      getHealth: vi.fn().mockResolvedValue({ healthy: true, providers: [] }),
    };

    // Mock Circuit Breaker
    mockBreakerFire = vi.fn();
    mockCircuitBreakerInstance = {
      on: vi.fn(),
      fire: mockBreakerFire,
      fallback: vi.fn(),
      stats: {},
      opened: false,
      halfOpen: false,
    };

    (createCircuitBreaker as any).mockReturnValue(mockCircuitBreakerInstance);

    // Initialize service (with providerService injected)
    emailService = new EmailService({
      config: mockConfig,
      logger: mockLogger,
      t: mockT,
      emailLogRepository: mockEmailLogRepository,
      providerService: mockProviderService,
    });

    await emailService.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize provider service and circuit breaker", () => {
      expect(mockProviderService.initialize).toHaveBeenCalled();
      expect(createCircuitBreaker).toHaveBeenCalled();
    });
  });

  describe("sendEmail", () => {
    const mailOptions = {
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
      text: "Test",
    };

    it("should send email successfully", async () => {
      mockBreakerFire.mockResolvedValue({
        messageId: "msg-123",
        provider: "smtp",
      });

      const result = await emailService.sendEmail(mailOptions);

      expect(mockEmailLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          status: "queued",
        })
      );

      expect(mockBreakerFire).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "test@example.com",
        }),
        expect.anything()
      );

      expect(mockEmailLogRepository.updateStatus).toHaveBeenCalledWith(
        "log-123",
        "sent",
        expect.objectContaining({
          messageId: "msg-123",
        })
      );

      expect(result).toEqual({
        messageId: "msg-123",
        provider: "smtp",
        emailLogId: "log-123",
      });
    });

    it("should handle send failure", async () => {
      const error = new Error("Send failed");
      mockBreakerFire.mockImplementation(async () => {
        // console.log("Mock fire called!");
        throw error;
      });

      await expect(emailService.sendEmail(mailOptions)).rejects.toThrow(
        EmailDispatchError
      );

      expect(mockEmailLogRepository.updateById).toHaveBeenCalledWith(
        "log-123",
        expect.objectContaining({
          status: "failed",
          error: "Send failed",
        })
      );
    });

    it("should continue sending even if log creation fails", async () => {
      mockEmailLogRepository.create.mockRejectedValue(new Error("Log failed"));
      mockBreakerFire.mockResolvedValue({
        messageId: "msg-123",
        provider: "smtp",
      });

      const result = await emailService.sendEmail(mailOptions);

      expect(mockBreakerFire).toHaveBeenCalled();
      expect(result).toEqual({
        messageId: "msg-123",
        provider: "smtp",
        emailLogId: undefined,
      });
    });

    it("should handle log update failure after success", async () => {
      mockBreakerFire.mockResolvedValue({
        messageId: "msg-123",
        provider: "smtp",
      });
      mockEmailLogRepository.updateStatus.mockRejectedValue(
        new Error("Update failed")
      );

      // Should not throw
      await emailService.sendEmail(mailOptions);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          emailLogId: "log-123",
        }),
        expect.stringContaining("Failed to update email log")
      );
    });

    it("should handle log update failure after failure", async () => {
      mockBreakerFire.mockRejectedValue(new Error("Send failed"));
      mockEmailLogRepository.updateById.mockRejectedValue(
        new Error("Update failed")
      );

      await expect(emailService.sendEmail(mailOptions)).rejects.toThrow(
        EmailDispatchError
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          emailLogId: "log-123",
        }),
        expect.stringContaining("Failed to update email log")
      );
    });
  });

  describe("sendVerificationEmail", () => {
    it("should call emailService.sendEmail with correct parameters", async () => {
      const user = { id: "u1", email: "u@test.com", name: "User" };
      const token = "token123";

      // Mock sendEmail on the service instance
      emailService.sendEmail = vi.fn().mockResolvedValue({ messageId: "123" });

      await emailService.sendVerificationEmail(user, token, mockT);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "u@test.com",
          type: "verification",
          subject: "email:verification.subject",
        })
      );
    });
  });
});
