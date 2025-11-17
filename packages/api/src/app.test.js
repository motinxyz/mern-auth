import request from "supertest";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

// --- Start of Mocks ---

// This is the new, correct mocking strategy.
// We create local, controllable mock objects.
const mockMongooseConnectionLocal = new EventEmitter();
mockMongooseConnectionLocal.readyState = 1; // Default to connected

const mockRedisConnectionLocal = {
  status: "ready", // Default to connected
};

// We then tell Vitest that whenever the '@auth/config' module is imported,
// it should replace the specified exports with our local mocks.
// This is the key fix.
vi.mock('@auth/config', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    redisConnection: mockRedisConnectionLocal, // Always use our mock
    t: (key) => key, // Provide a simple translator function
    i18nMiddleware: { // Mock the middleware to prevent side effects
      handle: () => (req, res, next) => next(),
    },
  };
});

// We still need to mock mongoose itself to control the `connection` object.
vi.mock("mongoose", async (importActual) => {
  const actualMongoose = await importActual();
  return {
    ...actualMongoose,
    default: {
      ...actualMongoose.default,
      connection: mockMongooseConnectionLocal,
    },
  };
});

// --- End of Mocks ---

describe("Healthz", () => {
  let app;

  // beforeEach runs before each test in this suite.
  beforeEach(async () => {
    // Reset modules to ensure a fresh import of app.js, which will then
    // pick up our mocks defined above.
    vi.resetModules();
    
    // Reset the state of our mocks before each test to ensure isolation.
    mockMongooseConnectionLocal.readyState = 1;
    mockRedisConnectionLocal.status = "ready";

    // Dynamically import the app *after* all mocks are in place.
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 OK when all services are healthy", async () => {
    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual("healthy");
    expect(res.body.data.db).toEqual("OK");
    expect(res.body.data.redis).toEqual("OK");
  });

  it("should return 503 when the database is not connected", async () => {
    // Change the state of our mock
    mockMongooseConnectionLocal.readyState = 0; // 0 = disconnected
    
    const res = await request(app).get("/healthz");
    
    // Assert the outcome
    expect(res.statusCode).toEqual(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toEqual("unhealthy");
    expect(res.body.data.db).toEqual("Error");
    expect(res.body.data.redis).toEqual("OK");
  });

  it("should return 503 when Redis is not connected", async () => {
    // Change the state of our mock
    mockRedisConnectionLocal.status = "end";
    
    const res = await request(app).get("/healthz");
    
    // Assert the outcome
    expect(res.statusCode).toEqual(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toEqual("unhealthy");
    expect(res.body.data.db).toEqual("OK");
    expect(res.body.data.redis).toEqual("Error");
  });
});

// Keep other test suites to ensure no regressions are introduced.
describe("Health Check", () => {
  let app;
  beforeAll(async () => {
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  it("should return 200 OK for /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Not Found Handler", () => {
  let app;
  beforeAll(async () => {
    const appModule = await import('./app.js');
    app = appModule.default;
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe("system:process.errors.notFound");
  });
});
