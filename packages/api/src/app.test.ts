import request from "supertest";
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";

// Hoisted mocks for shared usage across mocks
const mocks = vi.hoisted(() => {
  const mockMiddleware = vi.fn((req: any, _res: any, next: any) => {
    req.t = vi.fn((key) => key);
    next();
  });

  const mockRedisConnection = {
    ping: vi.fn().mockResolvedValue("PONG"),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    status: "ready",
    call: vi.fn().mockResolvedValue("OK"),
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockDatabaseService = {
    ping: vi.fn().mockResolvedValue(true),
    getConnectionState: vi.fn().mockReturnValue({ readyState: 1 }),
    emailLogRepository: {},
  };

  return {
    mockI18nMiddlewareHandle: vi.fn(() => mockMiddleware),
    mockMiddleware,
    mockRedisConnection,
    mockDatabaseService,
  };
});

vi.mock("ioredis", async () => {
  const { default: MockRedis } = await import("ioredis-mock");
  return { default: MockRedis };
});

vi.mock("mongoose", async (importActual: any) => {
  const actualMongoose = await importActual("mongoose");
  const { EventEmitter } = await import("node:events");
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn().mockResolvedValue(true),
      connection: Object.assign(new EventEmitter(), { readyState: 1 }),
    },
  };
});

vi.mock("@auth/queues", () => ({
  getQueueServices: vi.fn(() => ({
    emailProducerService: {
      addJob: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
    },
  })),
}));

vi.mock("express-rate-limit", () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
  rateLimit: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("rate-limit-redis", () => ({
  default: class RedisStore {
    init() { }
    increment() { }
    decrement() { }
    resetKey() { }
  },
  RedisStore: class RedisStore { },
}));

vi.mock("./middleware/security/rateLimiter.js", () => ({
  createApiLimiter: () => (_req: any, _res: any, next: any) => next(),
  createAuthLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("./middleware/core/loggerMiddleware.js", () => ({
  httpLogger: (_req: any, _res: any, next: any) => next(),
}));

vi.mock("@auth/config", () => {
  return {
    config: {
      get env() {
        return process.env.NODE_ENV || "test";
      },
      get isTest() {
        return process.env.NODE_ENV === "test";
      },
      get isDevelopment() {
        return process.env.NODE_ENV === "development";
      },
      get isProduction() {
        return process.env.NODE_ENV === "production";
      },
      port: 4000,
      redis: { circuitBreakerTimeout: 1000 },
      cors: { credentials: true, origin: "*" },
      clientUrl: "http://localhost:3000",
      observability: {
        enabled: false,
        grafana: {
          loki: { url: "", user: "", apiKey: "" },
          tempo: { url: "", user: "", apiKey: "" },
          prometheus: { url: "", user: "", apiKey: "" },
        },
        serviceName: "test-auth",
        serviceVersion: "0.0.0",
      },
      mongo: { uri: "mongodb://localhost:27017/test" },
      redisUrl: "redis://localhost:6379",
    },
  };
});

vi.mock("@auth/app-bootstrap", async (importActual: any) => {
  const actual: any = await importActual();
  return {
    ...actual,
    getRedisService: vi.fn(() => mocks.mockRedisConnection),
    getDatabaseService: vi.fn(() => mocks.mockDatabaseService),
    getLogger: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn((...args) => console.error("MOCK LOGGER ERROR:", JSON.stringify(args, null, 2))),
      warn: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    })),
  };
});

vi.mock("@auth/i18n", () => ({
  i18nInstance: {},
  i18nMiddleware: {
    handle: mocks.mockI18nMiddlewareHandle,
  },
}));

describe("App", () => {
  let app: any;
  let getDatabaseService: any;
  let getRedisService: any;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    const appModule = await import("./app.js");
    app = appModule.default;
    const appBootstrap = await import("@auth/app-bootstrap");
    getDatabaseService = appBootstrap.getDatabaseService;
    getRedisService = appBootstrap.getRedisService;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedisService().ping).mockResolvedValue("PONG");
    getRedisService().status = "ready";
    mocks.mockRedisConnection.status = "ready";
    mocks.mockDatabaseService.ping.mockResolvedValue(true);
    mocks.mockDatabaseService.getConnectionState.mockReturnValue({ readyState: 1 });
  });

  const getApp = () => app;

  it("should return health check response", async () => {
    const response = await request(getApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "READY");
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(getApp()).get("/unknown-route");
    expect(response.status).toBe(404);
  });

  it("should return 301 redirect for /api-docs", async () => {
    const response = await request(getApp()).get("/api-docs");
    expect(response.status).toBe(301);
  });

  it("should return 200 OK for /api-docs/", async () => {
    const response = await request(getApp()).get("/api-docs/");
    expect(response.status).toBe(200);
  });

  describe("Health Check Service Status", () => {
    it("should return 503 when the database is not connected", async () => {
      vi.mocked(getDatabaseService().ping).mockRejectedValueOnce(new Error("DB Down"));
      const response = await request(getApp()).get("/api/health");
      expect(response.status).toBe(503);
    });

    it("should return error when Redis is not connected", async () => {
      mocks.mockRedisConnection.status = "end";
      mocks.mockRedisConnection.ping.mockRejectedValueOnce(new Error("Redis Down"));

      const response = await request(getApp()).get("/api/health");
      expect(response.status).toBe(503);

    });
  });

  describe("i18n Middleware in non-test environment", () => {
    let devApp: any;

    beforeAll(async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "development");

      // Re-apply mongoose mock needs to be strict about return to avoid types mismatch if necessary
      // But vitest isolate:true should help. 
      // Just re-importing might be enough if config reads env dynamically.

      // Need to re-import app to trigger new config evaluation in app.ts top-level code?
      // Yes because app.ts has: if (config.isTest === true) ...
      const appModule = await import("./app.js");
      devApp = appModule.default;
    });

    afterAll(() => {
      vi.unstubAllEnvs();
      // We don't need to restore mocks as next file/isolation handles it, but good practice
    });

    it("should use i18nMiddleware.handle when NODE_ENV is not test", async () => {
      // Since the config mock is dynamic, config.isTest should be false now.
      await request(devApp).get("/api/health");
      expect(mocks.mockMiddleware).toHaveBeenCalled();
    });
  });
});
