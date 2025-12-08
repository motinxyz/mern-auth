import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEmailJobConsumer } from "./email.consumer.js";
import { EMAIL_JOB_TYPES } from "@auth/config";
import { EmailDispatchError } from "@auth/utils";

// Mock dependencies
vi.mock("@auth/config", () => ({
  getLogger: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  t: vi.fn((key) => key),
  i18nInstance: {

    getFixedT: vi.fn().mockResolvedValue((key: any) => key),
  },
  config: {},
  EMAIL_JOB_TYPES: {
    SEND_VERIFICATION_EMAIL: "send-verification-email",
  },
}));

describe("Email Consumer", () => {

  let mockEmailService: any;

  let mockLogger: any;

  let emailJobConsumer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    mockEmailService = {
      sendEmail: vi.fn(),
      sendVerificationEmail: vi
        .fn()
        .mockResolvedValue({ messageId: "msg-123" }),
    };
    emailJobConsumer = createEmailJobConsumer({
      emailService: mockEmailService,
      logger: mockLogger,
    });
  });

  it("should throw error if emailService is not provided", () => {

    expect(() => createEmailJobConsumer({ logger: mockLogger } as any)).toThrow(
      "EmailService is required"
    );
  });

  it("should process SEND_VERIFICATION_EMAIL job", async () => {
    const job = {
      id: "job-1",
      data: {
        type: EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
        data: {
          user: { id: "u1", email: "test@example.com" },
          token: "token123",
          locale: "en",
        },
      },
    };

    const result = await emailJobConsumer(job);

    expect(result).toEqual({
      success: true,
      message: "Email sent successfully",
    });

    expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      job.data.data.user,
      job.data.data.token,
      "en",
      expect.any(Object)
    );
  });

  it("should throw error for unknown job type", async () => {
    const job = {
      id: "job-2",
      data: {
        type: "UNKNOWN_TYPE",
        data: {},
      },
    };

    await expect(emailJobConsumer(job)).rejects.toThrow();
  });

  it("should handle processing errors", async () => {
    const job = {
      id: "job-3",
      data: {
        type: EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
        data: {
          user: { id: "u1", email: "test@example.com" },
          token: "token123",
        },
      },
    };

    mockEmailService.sendVerificationEmail.mockRejectedValue(
      new Error("Send failed")
    );

    await expect(emailJobConsumer(job)).rejects.toThrow(EmailDispatchError);
  });
});
