import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DatabaseConnectionManager from "./connection-manager.js";

// Mock mongoose
const mockPing = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockOn = vi.fn();

vi.mock("mongoose", () => ({
  default: {
    connect: (...args) => mockConnect(...args),
    disconnect: (...args) => mockDisconnect(...args),
    connection: {
      on: (...args) => mockOn(...args),
      readyState: 1,
      db: {
        admin: () => ({
          ping: mockPing,
        }),
      },
    },
  },
}));

describe("DatabaseConnectionManager", () => {
  let manager;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    mockConfig = {
      dbURI: "mongodb://localhost:27017",
      dbName: "test_db",
      dbMaxRetries: 3,
      dbInitialRetryDelayMs: 100,
      dbPoolSize: 100,
      dbMinPoolSize: 10,
      dbMaxIdleTimeMs: 30000,
      dbWaitQueueTimeoutMs: 10000,
      serverSelectionTimeoutMs: 5000,
      socketTimeoutMs: 45000,
    };

    manager = new DatabaseConnectionManager({
      config: mockConfig,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should throw ConfigurationError if config is missing", () => {
      expect(
        () => new DatabaseConnectionManager({ logger: mockLogger })
      ).toThrow();
    });

    it("should throw ConfigurationError if logger is missing", () => {
      expect(
        () => new DatabaseConnectionManager({ config: mockConfig })
      ).toThrow();
    });

    it("should initialize with valid options", () => {
      expect(manager.config).toBe(mockConfig);
      expect(manager.logger).toBe(mockLogger);
      expect(manager.isConnected).toBe(false);
    });
  });

  describe("connect", () => {
    it("should connect successfully on first attempt", async () => {
      mockConnect.mockResolvedValue(undefined);
      mockPing.mockResolvedValue({ ok: 1 });

      await manager.connect();

      expect(mockConnect).toHaveBeenCalledWith(
        mockConfig.dbURI,
        expect.objectContaining({
          dbName: mockConfig.dbName,
          maxPoolSize: 100,
          minPoolSize: 10,
        })
      );
      expect(manager.isConnected).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("success")
      );
    });

    it("should retry on connection failure", async () => {
      mockConnect
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockResolvedValueOnce(undefined);
      mockPing.mockResolvedValue({ ok: 1 });

      await manager.connect();

      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should throw after max retries exceeded", async () => {
      mockConnect.mockRejectedValue(new Error("Connection failed"));

      await expect(manager.connect()).rejects.toThrow();
      expect(mockConnect).toHaveBeenCalledTimes(mockConfig.dbMaxRetries);
    });
  });

  describe("disconnect", () => {
    it("should disconnect successfully", async () => {
      mockDisconnect.mockResolvedValue(undefined);

      await manager.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(manager.isConnected).toBe(false);
    });

    it("should log error on disconnect failure", async () => {
      const error = new Error("Disconnect failed");
      mockDisconnect.mockRejectedValue(error);

      await expect(manager.disconnect()).rejects.toThrow("Disconnect failed");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("getConnectionState", () => {
    it("should return connection state", () => {
      const state = manager.getConnectionState();

      expect(state).toEqual({
        isConnected: false,
        readyState: 1,
        readyStateLabel: "connected",
      });
    });
  });

  describe("healthCheck", () => {
    it("should return unhealthy if not connected", async () => {
      manager.isConnected = false;

      const health = await manager.healthCheck();

      expect(health.healthy).toBe(false);
    });

    it("should return healthy if ping succeeds", async () => {
      manager.isConnected = true;
      mockPing.mockResolvedValue({ ok: 1 });

      const health = await manager.healthCheck();

      expect(health).toEqual({ healthy: true });
    });

    it("should return unhealthy if ping fails", async () => {
      manager.isConnected = true;
      mockPing.mockRejectedValue(new Error("Ping failed"));

      const health = await manager.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.reason).toBe("Ping failed");
    });
  });

  describe("ping", () => {
    it("should throw if not connected", async () => {
      // Mock readyState to 0 (disconnected)
      const mongoose = await import("mongoose");
      vi.spyOn(
        mongoose.default.connection,
        "readyState",
        "get"
      ).mockReturnValue(0);

      await expect(manager.ping()).rejects.toThrow();
    });
  });
});
