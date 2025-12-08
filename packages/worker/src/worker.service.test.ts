import { describe, it, expect, vi, beforeEach } from "vitest";
import WorkerService from "./worker.service.js";

// Mock QueueProcessorService
vi.mock("./queue-processor.service.js", () => {

  const MockProcessor = vi.fn(function (this: any) {
    this.queueName = "test-queue";
  });
  MockProcessor.prototype.initialize = vi.fn().mockResolvedValue(undefined);
  MockProcessor.prototype.close = vi.fn().mockResolvedValue(undefined);
  MockProcessor.prototype.pause = vi.fn().mockResolvedValue(undefined);
  MockProcessor.prototype.resume = vi.fn().mockResolvedValue(undefined);
  MockProcessor.prototype.getHealth = vi.fn().mockResolvedValue({
    healthy: true,
    queueName: "test-queue",
  });
  MockProcessor.prototype.getMetrics = vi.fn().mockReturnValue({
    processed: 10,
    active: 0,
  });

  return {
    default: MockProcessor,
  };
});

describe("WorkerService", () => {

  let service: any;

  let mockLogger: any;

  let mockT: any;

  let mockRedisConnection: any;

  let mockDatabaseService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      debug: vi.fn(),
    };


    mockT = vi.fn((key: any) => key);

    mockRedisConnection = {
      quit: vi.fn().mockResolvedValue(undefined),
    };

    mockDatabaseService = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
      ping: vi.fn().mockResolvedValue(true),
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

      expect(() => new WorkerService({} as any)).toThrow();
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
      const initService = vi.fn().mockResolvedValue(undefined);
      service.initServices = [initService];

      await service.start();

      expect(mockDatabaseService.connect).toHaveBeenCalled();
      expect(initService).toHaveBeenCalled();
      expect(service.getProcessors()[0].initialize).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("Worker started")
      );
    });

    it("should handle startup failure", async () => {
      mockDatabaseService.connect.mockRejectedValue(new Error("DB fail"));
      await expect(service.start()).rejects.toThrow("DB fail");
      expect(mockLogger.error).toHaveBeenCalled();
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
        metrics: { processed: 10, active: 0 },
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
