import request from "supertest";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";

const { mockI18nMiddlewareHandle, mockMiddleware } = vi.hoisted(() => {
  const mockMiddleware = vi.fn((req, res, next) => {
    req.t = vi.fn((key) => key); // Mock req.t
    next();
  });
  return {
    mockI18nMiddlewareHandle: vi.fn(() => mockMiddleware), // This now returns the middleware
    mockMiddleware, // Export the actual middleware for assertions
  };
});

vi.mock("ioredis", async () => {
  const { default: MockRedis } = await import("ioredis-mock");
  return { default: MockRedis };
});

vi.mock("mongoose", async (importActual) => {
  const actualMongoose = await importActual("mongoose");
  const { EventEmitter } = await import("node:events");
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn().mockResolvedValue(true),
      connection: new EventEmitter(),
    },
  };
});

vi.mock("@auth/queues/producers", () => ({
  addEmailJob: vi.fn(),
}));

vi.mock('@auth/config', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    i18nMiddleware: {
      handle: mockI18nMiddlewareHandle,
    },
    i18nInstance: {}, // Mock i18nInstance as well
  };
});
 
describe("Health Check", () => {
  let app;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Explicitly set NODE_ENV for this test block
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  it("should return 200 OK for /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual("system:server.healthCheck");
    expect(res.body.data.status).toEqual("healthy");
  });
});

describe("Not Found Handler", () => {
  let app;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Explicitly set NODE_ENV for this test block
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toEqual(404);
    // Assuming the notFound handler uses ApiError which creates a response
    // with a message property. The i18n key might not be translated in test.
    expect(res.body.message).toBe("system:process.errors.notFound");
  });
});

describe("Swagger UI", () => {
  let app;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Explicitly set NODE_ENV for this test block
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  it("should return 301 redirect for /api-docs", async () => {
    const res = await request(app).get("/api-docs");
    // swagger-ui-express redirects /api-docs to /api-docs/
    expect(res.statusCode).toEqual(301);
  });

  it("should return 200 OK for /api-docs/", async () => {
    const res = await request(app).get("/api-docs/");
    expect(res.statusCode).toEqual(200);
  });
});

describe("Healthz", () => {
  let app;
  let mongoose;
  let redisConnection;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Explicitly set NODE_ENV for this test block
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  beforeEach(async () => {
    mongoose = (await import("mongoose")).default;
    redisConnection = (await import("@auth/queues")).redisConnection;
    mongoose.connection.readyState = 1; // Ensure DB is connected for most tests
    redisConnection.status = "ready"; // Ensure Redis is connected for most tests
  });

  afterEach(() => {
    mongoose.connection.readyState = 1;
    redisConnection.status = "ready";
  });

  it("should return 200 OK when all services are healthy", async () => {
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: "OK", db: "OK", redis: "OK" });
  });

  it("should return 503 when the database is not connected", async () => {
    mongoose.connection.readyState = 0; // 0 = disconnected
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(503);
    expect(res.body).toEqual({ status: "Error", db: "Error", redis: "OK" });
  });

  it("should return 503 when Redis is not connected", async () => {
    redisConnection.status = "end";
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(503);
    expect(res.body).toEqual({ status: "Error", db: "OK", redis: "Error" });
  });
});

describe('i18n Middleware in non-test environment', () => {
  let app;

  beforeAll(async () => {
    vi.resetModules(); // Reset module registry to ensure a fresh import
    vi.stubEnv('NODE_ENV', 'development');

    // Re-apply mongoose mock after resetting modules
    vi.mock("mongoose", async (importActual) => {
      const actualMongoose = await importActual("mongoose");
      const { EventEmitter } = await import("node:events");
      return {
        ...actualMongoose,
        default: {
          ...actualMongoose.default,
          connect: vi.fn().mockResolvedValue(true),
          disconnect: vi.fn().mockResolvedValue(true),
          connection: new EventEmitter(),
        },
      };
    });

    // Dynamically import app after NODE_ENV is set and mocks are in place
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should use i18nMiddleware.handle when NODE_ENV is not test', async () => {
    await request(app).get('/health');
    expect(mockMiddleware).toHaveBeenCalled(); // Assert on the returned middleware
  });
});