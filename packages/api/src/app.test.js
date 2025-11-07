import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import app from "./app.js";

vi.mock("ioredis", async () => {
  const { default: MockRedis } = await import("ioredis-mock");
  return { default: MockRedis };
});

vi.mock("mongoose", async () => {
  const actualMongoose = await vi.importActual("mongoose");
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
 
describe("Health Check", () => {
  it("should return 200 OK for /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual("System is healthy and operational");
    expect(res.body.data.status).toEqual("healthy");
  });
});

describe("Not Found Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toEqual(404);
    // Assuming the notFound handler uses ApiError which creates a response
    // with a message property. The i18n key might not be translated in test.
    expect(res.body.message).toBe("process.errors.notFound");
  });
});

describe("Swagger UI", () => {
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
  let mongoose;
  let redisConnection;

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