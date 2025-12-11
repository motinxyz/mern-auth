import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { User } from "@auth/database";
import { RegistrationService } from "./registration.service.js";
import {
  TooManyRequestsError,
  ConflictError,
} from "@auth/utils";

// Mock utils
vi.mock("@auth/utils", async () => {
  const actual = await vi.importActual("@auth/utils");
  return {
    ...actual,
    normalizeEmail: (email: any) => email.toLowerCase(), // Simple mock for testing
  };
});

// Mock Redis and config
vi.mock("@auth/config", () => ({
  getLogger: vi.fn(() => ({
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  })),
  redisConnection: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  t: vi.fn((key: any) => key),
  config: {
    redis: {
      prefixes: {
        verifyEmailRateLimit: "rate-limit:verify-email:",
        verifyEmail: "verify-email:",
      },
    },
    verificationTokenExpiresIn: 180,
  },
  EMAIL_JOB_TYPES: {
    SEND_VERIFICATION_EMAIL: "send-verification-email",
  },
}));

vi.mock("@auth/observability", () => ({
  withSpan: vi.fn((...args) => {
    const fn = args.find((arg) => typeof arg === "function");
    if (fn) return fn();
    return Promise.resolve();
  }),
  addSpanAttributes: vi.fn(),
  getTraceContext: vi.fn().mockReturnValue({ traceId: "test-trace-id", spanId: "test-span-id" }),
}));

// Mock mongoose
vi.mock("mongoose", async () => {
  const actualMongoose = (await vi.importActual("mongoose")) as any;
  const session = {
    withTransaction: vi.fn().mockImplementation(async (fn: any) => fn(session)),
    endSession: vi.fn(),
  };
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      startSession: vi.fn().mockResolvedValue(session),
      connection: new actualMongoose.default.EventEmitter(),
    },
  };
});

// Mock database
vi.mock("@auth/database", async (importOriginal: any) => {
  const actual: any = await importOriginal();
  actual.User.create = vi.fn();
  actual.User.findById = vi.fn();
  actual.User.db = {
    startSession: vi.fn().mockResolvedValue({
      withTransaction: vi.fn().mockImplementation(async (fn: any) => fn()),
      endSession: vi.fn(),
    }),
  };
  return actual;
});

describe("Registration Service", () => {
  let mockRedisConnection: any;
  let mockConfig: any;
  let registrationService: any;
  let mockEmailProducer: any;
  let MockUserModel: any;
  let mockRedis: any;
  let mockTokenService: any;
  let mockSentry: any;
  let mockLogger: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const configModule: any = await vi.importMock("@auth/config");
    mockRedisConnection = configModule.redisConnection;
    mockConfig = configModule.config;

    // Initialize new mock variables
    MockUserModel = User; // Using the actual User model for now, but can be a full mock if needed
    mockRedis = mockRedisConnection;
    mockTokenService = {
      createVerificationToken: vi.fn().mockResolvedValue("test_token"),
    };
    mockSentry = {
      captureException: vi.fn(),
    };
    mockLogger = {
      child: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };

    mockEmailProducer = {
      addJob: vi.fn().mockResolvedValue({ id: "job-123" }),
    };

    registrationService = new RegistrationService({
      userModel: MockUserModel,
      redis: mockRedis,
      config: mockConfig,
      emailProducer: mockEmailProducer,
      tokenService: mockTokenService,
      sentry: mockSentry,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user and orchestrate verification", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        locale: "en",
      };
      const newUser = {
        ...userData,
        _id: "123",
        toJSON: () => ({ ...userData, id: "123" }),
        toObject: () => ({ ...userData, _id: "123" }),
      };

      const session = {
        withTransaction: vi.fn().mockImplementation(async (fn) => fn(session)),
        endSession: vi.fn(),
      };
      (User.db.startSession as any).mockResolvedValue(session);
      (User.create as any).mockResolvedValue([newUser]);
      registrationService.tokenService.createVerificationToken.mockResolvedValue(
        "test_token"
      );
      mockRedisConnection.get.mockResolvedValue(null);
      mockRedisConnection.set.mockResolvedValue("OK");

      // Ensure emailProducer.addJob is properly mocked
      mockEmailProducer.addJob.mockResolvedValue({
        id: "job-123",
      });

      const result = await registrationService.register(userData);

      expect(User.db.startSession).toHaveBeenCalled();
      expect(
        registrationService.tokenService.createVerificationToken
      ).toHaveBeenCalledWith(expect.objectContaining({
        ...userData,
        _id: "123",
      }));
      expect(mockEmailProducer.addJob).toHaveBeenCalled();
      expect(mockRedisConnection.set).toHaveBeenCalled();
      expect(result).toEqual({ ...userData, id: "123" });
    });

    it("should throw TooManyRequestsError if rate limit is exceeded", async () => {
      const userData = {
        name: "Test",
        email: "test@example.com",
        password: "password123",
      };

      mockRedisConnection.get.mockResolvedValue("true");

      await expect(registrationService.register(userData)).rejects.toThrow(
        TooManyRequestsError
      );
    });

    it("should throw ConflictError if email already exists", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const session = {
        withTransaction: vi.fn().mockImplementation(async (fn: any) => fn(session)),
        endSession: vi.fn(),
      };
      (User.db.startSession as any).mockResolvedValue(session);

      const dbError: any = new Error("Duplicate key");
      dbError.code = 11000;
      dbError.keyPattern = { email: 1 };
      dbError.keyValue = { email: "test@example.com" };

      (User.create as any).mockRejectedValue(dbError);
      mockRedisConnection.get.mockResolvedValue(null);

      await expect(registrationService.register(userData)).rejects.toThrow(
        ConflictError
      );
    });

    it("should handle failure when adding job to queue", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        locale: "en",
      };
      const newUser = {
        ...userData,
        _id: "123",
        toJSON: () => ({ ...userData, id: "123" }),
        toObject: () => ({ ...userData, _id: "123" }),
      };

      const session = {
        withTransaction: vi.fn().mockImplementation(async (fn) => fn(session)),
        endSession: vi.fn(),
      };
      (User.db.startSession as any).mockResolvedValue(session);
      (User.create as any).mockResolvedValue([newUser]);
      registrationService.tokenService.createVerificationToken.mockResolvedValue(
        "test_token"
      );
      mockRedisConnection.get.mockResolvedValue(null);

      // Mock queue failure
      mockEmailProducer.addJob.mockRejectedValue(new Error("Queue error"));

      // It should throw ServiceUnavailableError
      const { ServiceUnavailableError } = await import("@auth/utils");
      await expect(registrationService.register(userData)).rejects.toThrow(
        ServiceUnavailableError
      );
    });

    it("should handle failure when setting rate limit", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        locale: "en",
      };
      const newUser = {
        ...userData,
        _id: "123",
        toJSON: () => ({ ...userData, id: "123" }),
        toObject: () => ({ ...userData, _id: "123" }),
      };

      const session = {
        withTransaction: vi.fn().mockImplementation(async (fn) => fn(session)),
        endSession: vi.fn(),
      };
      (User.db.startSession as any).mockResolvedValue(session);
      (User.create as any).mockResolvedValue([newUser]);
      registrationService.tokenService.createVerificationToken.mockResolvedValue(
        "test_token"
      );
      mockRedisConnection.get.mockResolvedValue(null);
      mockEmailProducer.addJob.mockResolvedValue({ id: "job-123" });

      // Mock Redis set failure
      mockRedisConnection.set.mockRejectedValue(new Error("Redis error"));

      // It should throw ServiceUnavailableError
      const { ServiceUnavailableError } = await import("@auth/utils");
      await expect(registrationService.register(userData)).rejects.toThrow(
        ServiceUnavailableError
      );
    });
  });
});
