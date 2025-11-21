import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import nodemailer from "nodemailer";
import CircuitBreaker from "opossum"; // Import CircuitBreaker
import { sendEmail, initEmailService } from "./index.js";
import { config, logger, t as systemT } from "@auth/config";
import {
  EmailDispatchError,
  EmailServiceInitializationError,
} from "@auth/utils";

// Mock external dependencies
vi.mock("nodemailer");
vi.mock("opossum"); // Mock opossum
vi.mock("@auth/database", () => ({
  EmailLog: {
    create: vi.fn().mockResolvedValue({ _id: "mock-log-id" }),
    updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
  },
}));
vi.mock("@auth/config", () => {
  const mockLoggerChild = vi.fn();
  // Set a default mockReturnValue for mockLoggerChild
  mockLoggerChild.mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
  });

  return {
    config: {
      smtp: {
        host: "mock-smtp.example.com",
        port: 587,
        user: "mock-user",
        pass: "mock-pass",
      },
      emailFrom: "mock@example.com",
      env: "development",
    },
    logger: {
      child: mockLoggerChild,
    },
    t: vi.fn((key) => key), // Mock translation function
  };
});

// Mock EmailDispatchError as a class
vi.mock("@auth/utils", async () => {
  const actual = await vi.importActual("@auth/utils");
  return {
    ...actual,
    EmailDispatchError: class EmailDispatchError extends Error {
      constructor(message, originalError) {
        super(message);
        this.name = "EmailDispatchError";
        this.originalError = originalError;
      }
    },
    EmailServiceInitializationError: class EmailServiceInitializationError extends Error {
      constructor(message, originalError) {
        super(message);
        this.name = "EmailServiceInitializationError";
        this.originalError = originalError;
      }
    },
  };
});

describe("Email Service", () => {
  let mockSendMail;
  let mockTransport;
  let mockCircuitBreakerInstance;
  let mockBreakerOn;
  let mockBreakerFire;
  let mockBreakerFallback;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockBreakerOn = vi.fn(); // Revert to simple vi.fn()
    mockBreakerFire = vi.fn();
    mockBreakerFallback = vi.fn();
    mockCircuitBreakerInstance = {
      on: mockBreakerOn,
      fire: mockBreakerFire,
      fallback: mockBreakerFallback,
    };
    CircuitBreaker.mockImplementation(function () {
      return mockCircuitBreakerInstance;
    });

    mockSendMail = vi.fn();
    mockTransport = {
      verify: vi.fn().mockResolvedValue(true),
      sendMail: mockSendMail,
    };
    nodemailer.createTransport.mockReturnValue(mockTransport);

    // Ensure logger.child has been called at least once before accessing mock.results
    const { logger } = await import("@auth/config");
    logger.child({ module: "email-utility" }); // Explicitly call it once

    // Reset the mock functions on the emailUtilLogger that was created when index.js was loaded
    const emailUtilLoggerMock = logger.child.mock.results[0].value; // Now this should work
    emailUtilLoggerMock.info.mockClear();
    emailUtilLoggerMock.warn.mockClear();
    emailUtilLoggerMock.error.mockClear();
    emailUtilLoggerMock.fatal.mockClear();
    emailUtilLoggerMock.debug.mockClear();

    await initEmailService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockReset();
  });

  describe("initEmailService failure handling", () => {
    // No beforeEach here, or a minimal one that doesn't call initEmailService
    // The test itself will call initEmailService
    it("should call process.exit and log fatal error if SMTP connection verification fails", async () => {
      // Temporarily set env to something other than 'test' to trigger the verification logic
      const originalEnv = config.env;
      config.env = "development";

      const mockFatal = vi.fn();
      const { logger } = await import("@auth/config");
      // Get the actual mock object returned by logger.child and set its fatal method
      const emailUtilLoggerMock = logger.child.mock.results[0].value;
      emailUtilLoggerMock.fatal = mockFatal; // Assign our specific mockFatal

      mockTransport.verify.mockRejectedValue(
        new Error("SMTP verification failed")
      );

      try {
        await initEmailService();
      } catch (error) {
        // We expect an EmailServiceInitializationError to be thrown
        expect(error).toBeInstanceOf(EmailServiceInitializationError);
      }

      expect(mockFatal).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        systemT("email:errors.smtpConnectionFailed")
      );

      config.env = originalEnv;
    });
  });

  it("should send an email successfully", async () => {
    mockBreakerFire.mockResolvedValue({
      messageId: "mock-message-id",
      provider: "primary",
    }); // Mock fire method

    const mailOptions = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test HTML</p>",
      text: "Test Text",
      type: "notification",
    };

    const result = await sendEmail(mailOptions);

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(mockBreakerFire).toHaveBeenCalled();
    expect(result).toHaveProperty("messageId", "mock-message-id");
  });

  it("should open the circuit breaker and throw EmailDispatchError on repeated failures", async () => {
    mockBreakerFire.mockRejectedValue(new Error("SMTP connection failed")); // Mock fire method to reject

    const mailOptions = {
      to: "test@example.com",
      subject: "Failing Subject",
      html: "<p>Failing HTML</p>",
      text: "Failing Text",
      type: "notification",
    };

    await expect(sendEmail(mailOptions)).rejects.toThrow(EmailDispatchError);
    expect(mockBreakerFire).toHaveBeenCalled();
  });

  it("should send a verification email", async () => {
    const user = {
      id: "user123",
      email: "user@example.com",
      name: "Test User",
    };
    const token = "mockVerificationToken";
    const mockT = vi.fn((key, options) => {
      if (key === "email:verification.subject") return "Verify Your Email";
      if (key === "email:verification.text")
        return `Hello ${options.name}, please verify your email: ${options.verificationUrl}`;
      return key;
    });

    mockBreakerFire.mockResolvedValue({ messageId: "verification-message-id" });

    // Import sendVerificationEmail here to ensure it's the one from the module
    const { sendVerificationEmail } = await import("./index.js");

    await sendVerificationEmail(user, token, mockT);

    expect(mockBreakerFire).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: "Verify Your Email",
        html: expect.stringContaining(user.name),
        text: expect.stringContaining(token),
      })
    );
    expect(mockT).toHaveBeenCalledWith("email:verification.subject");
    expect(mockT).toHaveBeenCalledWith(
      "email:verification.text",
      expect.any(Object)
    );
  });

  it("should transition circuit breaker through open, half-open, and close states", async () => {
    vi.useFakeTimers();

    const mailOptions = {
      to: "test@example.com",
      subject: "Circuit Breaker Test",
      html: "<p>Circuit Breaker Test</p>",
      text: "Circuit Breaker Test",
      type: "notification",
    };

    // Find the callbacks from mockBreakerOn.mock.calls
    let openCallback, halfOpenCallback, closeCallback;
    mockBreakerOn.mock.calls.forEach(([event, callback]) => {
      if (event === "open") openCallback = callback;
      if (event === "halfOpen") halfOpenCallback = callback;
      if (event === "close") closeCallback = callback;
    });

    // 1. Trigger failures to open the circuit
    mockBreakerFire.mockRejectedValue(new Error("SMTP connection failed"));
    for (let i = 0; i < 5; i++) {
      await expect(sendEmail(mailOptions)).rejects.toThrow(EmailDispatchError);
    }
    // Manually invoke the 'open' callback
    if (openCallback) openCallback();
    const { logger } = await import("@auth/config");
    const emailUtilLoggerMock = logger.child.mock.results[0].value;
    expect(emailUtilLoggerMock.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: "circuit_breaker_open" }),
      systemT("email:logs.circuitBreakerOpen")
    );

    // 2. Advance timers to trigger half-open
    vi.advanceTimersByTime(30000); // resetTimeout is 30 seconds
    // Manually invoke the 'halfOpen' callback
    if (halfOpenCallback) halfOpenCallback();
    expect(emailUtilLoggerMock.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: "circuit_breaker_half_open" }),
      systemT("email:logs.circuitBreakerHalfOpen")
    );

    // 3. Mock success to close the circuit
    mockBreakerFire.mockResolvedValue({
      messageId: "mock-message-id-2",
      provider: "primary",
    });
    await sendEmail(mailOptions);
    // Manually invoke the 'close' callback
    if (closeCallback) closeCallback();
    expect(emailUtilLoggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "circuit_breaker_closed" }),
      systemT("email:logs.circuitBreakerClosed")
    );

    vi.useRealTimers();
  });
});
