import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { loggerMiddlewareFactory } from "./loggerMiddleware.js";
import { createContainer, asValue } from "awilix";
import { v4 as uuidv4 } from "uuid";

// Mock uuidv4
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid"),
}));

let mockPinoHttp;
let mockStdSerializers;

beforeAll(() => {
  mockPinoHttp = vi.fn(() => (req, res, next) => next());
  mockStdSerializers = {
    req: vi.fn(),
    res: vi.fn(),
  };

  vi.doMock("pino-http", () => ({
    __esModule: true,
    default: mockPinoHttp,
    stdSerializers: mockStdSerializers,
  }));
});

// Import pino-http after vi.doMock
import pinoHttp, { stdSerializers } from "pino-http";

describe("loggerMiddlewareFactory", () => {
  let mockLogger;
  let mockConfig;
  let httpLoggerMiddleware;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      child: vi.fn(() => mockLogger), // child returns itself
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    mockConfig = {
      isDevelopment: false,
    };

    // Directly call the factory to get the middleware
    httpLoggerMiddleware = loggerMiddlewareFactory({ logger: mockLogger, config: mockConfig });
  });

  it("should call pinoHttp with the correct logger and config", () => {
    expect(mockPinoHttp).toHaveBeenCalledTimes(1);
    const pinoHttpOptions = mockPinoHttp.mock.calls[0][0];

    expect(pinoHttpOptions.logger).toBe(mockLogger.child.mock.results[0].value); // Expect the child logger
    expect(pinoHttpOptions.serializers.req).toBe(mockStdSerializers.req);
    expect(pinoHttpOptions.serializers.res).toBe(mockStdSerializers.res);
    expect(pinoHttpOptions.transport).toBeUndefined(); // Not in development
  });

  it("should configure serializers for development environment", () => {
    mockConfig.isDevelopment = true;
    loggerMiddlewareFactory({ logger: mockLogger, config: mockConfig });
    const pinoHttpOptions = mockPinoHttp.mock.calls[1][0]; // Get the second call

    expect(pinoHttpOptions.serializers.req({ method: "GET", url: "/test" })).toEqual({ method: "GET", url: "/test" });
    expect(pinoHttpOptions.serializers.res({ statusCode: 200 })).toEqual({ statusCode: 200 });
    expect(pinoHttpOptions.transport).toEqual(
      expect.objectContaining({
        target: "pino-pretty",
      })
    );
  });

  it("should configure serializers for production environment", () => {
    mockConfig.isDevelopment = false;
    loggerMiddlewareFactory({ logger: mockLogger, config: mockConfig });
    const pinoHttpOptions = mockPinoHttp.mock.calls[1][0]; // Get the second call

    expect(pinoHttpOptions.serializers.req).toBe(mockStdSerializers.req);
    expect(pinoHttpOptions.serializers.res).toBe(mockStdSerializers.res);
    expect(pinoHttpOptions.transport).toBeUndefined();
  });

  describe("genReqId", () => {
    let genReqIdFn;
    let req, res;

    beforeEach(() => {
      const pinoHttpOptions = mockPinoHttp.mock.calls[0][0];
      genReqIdFn = pinoHttpOptions.genReqId;
      req = { id: undefined, headers: {}, method: "GET", url: "/test" };
      res = { setHeader: vi.fn() };
      uuidv4.mockClear(); // Clear uuidv4 mock calls for this describe block
    });

    it("should generate a new ID if none exists", () => {
      const id = genReqIdFn(req, res);
      expect(uuidv4).toHaveBeenCalledTimes(1);
      expect(id).toBe("mock-uuid");
      expect(req.id).toBeUndefined(); // genReqId does not set req.id
      expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", "mock-uuid");
    });

    it("should use existing req.id if present", () => {
      req.id = "existing-req-id";
      const id = genReqIdFn(req, res);
      expect(uuidv4).not.toHaveBeenCalled();
      expect(id).toBe("existing-req-id");
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it("should use existing x-request-id header if present", () => {
      req.headers["x-request-id"] = "existing-header-id";
      const id = genReqIdFn(req, res);
      expect(uuidv4).not.toHaveBeenCalled();
      expect(id).toBe("existing-header-id");
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });

  describe("customLogLevel", () => {
    let customLogLevelFn;
    let req, res;

    beforeEach(() => {
      const pinoHttpOptions = mockPinoHttp.mock.calls[0][0];
      customLogLevelFn = pinoHttpOptions.customLogLevel;
      req = {};
      res = { statusCode: 200 };
    });

    it("should return 'warn' for 4xx status codes", () => {
      res.statusCode = 400;
      expect(customLogLevelFn(req, res)).toBe("warn");
      res.statusCode = 499;
      expect(customLogLevelFn(req, res)).toBe("warn");
    });

    it("should return 'error' for 5xx status codes or errors", () => {
      res.statusCode = 500;
      expect(customLogLevelFn(req, res)).toBe("error");
      res.statusCode = 503;
      expect(customLogLevelFn(req, res)).toBe("error");
      expect(customLogLevelFn(req, res, new Error("test"))).toBe("error");
    });

    it("should return 'silent' for 3xx status codes", () => {
      res.statusCode = 300;
      expect(customLogLevelFn(req, res)).toBe("silent");
      res.statusCode = 302;
      expect(customLogLevelFn(req, res)).toBe("silent");
    });

    it("should return 'info' for other status codes (e.g., 2xx)", () => {
      res.statusCode = 200;
      expect(customLogLevelFn(req, res)).toBe("info");
      res.statusCode = 201;
      expect(customLogLevelFn(req, res)).toBe("info");
    });
  });
});
