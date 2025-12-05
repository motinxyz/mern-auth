import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WorkerService from "./worker.service.js";

// Mock QueueProcessorService
vi.mock("./queue-processor.service.js", () => {
  const MockProcessor = vi.fn(function () {
    this.queueName = "test-queue";
  });
  MockProcessor.prototype.initialize = vi.fn().mockResolvedValue();
  MockProcessor.prototype.close = vi.fn().mockResolvedValue();
  MockProcessor.prototype.pause = vi.fn().mockResolvedValue();
  MockProcessor.prototype.resume = vi.fn().mockResolvedValue();
  MockProcessor.prototype.getHealth = vi.fn().mockResolvedValue({
    healthy: true,
    queueName: "test-queue",
  });
  MockProcessor.prototype.getMetrics = vi.fn().mockReturnValue({
    processed: 10,
  });

  return {
    default: MockProcessor,
  };
});

describe("WorkerService", () => {
  let service;
  let mockLogger;
  let mockT;
  let mockRedisConnection;
  let mockDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    mockT = vi.fn((key) => key);

    mockRedisConnection = {
      quit: vi.fn().mockResolvedValue(),
    };

    mockDatabaseService = {
      connect: vi.fn().mockResolvedValue(),
      disconnect: vi.fn().mockResolvedValue(),
      healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
    };

    service = new WorkerService({
      logger: mockLogger,
      t: mockT,
      redisConnection: mockRedisConnection,
      databaseService: mockDatabaseService,
    });
  });

  describe("Initialization", () => {
    it("should require mandatory options", () => {
      expect(() => new WorkerService({})).toThrow();
    });

    it("should register processors", () => {
      const processor = service.registerProcessor({
        queueName: "test-queue",
        processor: vi.fn(),
      });

      expect(service.getProcessors()).toHaveLength(1);
      expect(processor).toBeDefined();
    });
  });

  describe("Lifecycle", () => {
    beforeEach(() => {
      service.registerProcessor({
        queueName: "test-queue",
        processor: vi.fn(),
      });
    });

    it("should start service and dependencies", async () => {
      const initService = vi.fn().mockResolvedValue();
      service.initServices = [initService];

      await service.start();

      expect(mockDatabaseService.connect).toHaveBeenCalled();
      expect(initService).toHaveBeenCalled();
      expect(service.getProcessors()[0].initialize).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("Worker service ready")
      );
    });

    it("should handle startup failure", async () => {
      mockDatabaseService.connect.mockRejectedValue(new Error("DB fail"));
      await expect(service.start()).rejects.toThrow("DB fail");
      expect(mockLogger.fatal).toHaveBeenCalled();
    });

    it("should stop service and dependencies", async () => {
      await service.stop();

      expect(service.getProcessors()[0].close).toHaveBeenCalled();
      // Redis quit should NOT be called (as per our recent change)
      expect(mockRedisConnection.quit).not.toHaveBeenCalled();
      expect(mockDatabaseService.disconnect).toHaveBeenCalled();
    });
  });

  describe("Health & Metrics", () => {
    beforeEach(() => {
      service.registerProcessor({
        queueName: "test-queue",
        processor: vi.fn(),
      });
    });

    it("should return aggregated health", async () => {
      const health = await service.getHealth();

      expect(health).toEqual({
        healthy: true,
        database: { healthy: true },
        processors: [
          {
            healthy: true,
            queueName: "test-queue",
          },
        ],
      });
    });

    it("should return aggregated metrics", () => {
      const metrics = service.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual({
        queueName: "test-queue",
        metrics: { processed: 10 },
      });
    });
  });

  describe("Control", () => {
    beforeEach(() => {
      service.registerProcessor({
        queueName: "test-queue",
        processor: vi.fn(),
      });
    });

    it("should pause all processors", async () => {
      await service.pauseAll();
      expect(service.getProcessors()[0].pause).toHaveBeenCalled();
    });

    it("should resume all processors", async () => {
      await service.resumeAll();
      expect(service.getProcessors()[0].resume).toHaveBeenCalled();
    });
  });
});
