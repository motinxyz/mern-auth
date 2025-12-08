import { describe, it, expect, vi, beforeEach } from "vitest";
import QueueProducerService from "./queue-producer.service.js";
import { Queue } from "bullmq";

// Mock BullMQ
vi.mock("bullmq", () => {
  const MockQueue = vi.fn();
  MockQueue.prototype.add = vi.fn().mockResolvedValue({ id: "job-123" });
  MockQueue.prototype.on = vi.fn();
  MockQueue.prototype.close = vi.fn().mockResolvedValue();
  MockQueue.prototype.pause = vi.fn().mockResolvedValue();
  MockQueue.prototype.resume = vi.fn().mockResolvedValue();
  MockQueue.prototype.getWaitingCount = vi.fn().mockResolvedValue(5);
  MockQueue.prototype.getActiveCount = vi.fn().mockResolvedValue(2);
  MockQueue.prototype.getCompletedCount = vi.fn().mockResolvedValue(100);
  MockQueue.prototype.getFailedCount = vi.fn().mockResolvedValue(3);
  MockQueue.prototype.getDelayedCount = vi.fn().mockResolvedValue(1);
  MockQueue.prototype.client = {
    ping: vi.fn().mockResolvedValue("PONG"),
  };

  return {
    Queue: MockQueue,
  };
});

describe("QueueProducerService", () => {
  let service;
  let mockLogger;
  let mockT;
  let mockConnection;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    mockT = vi.fn((key) => key);
    mockConnection = {};

    service = new QueueProducerService({
      queueName: "test-queue",
      connection: mockConnection,
      logger: mockLogger,
      t: mockT,
    });
  });

  describe("Initialization", () => {
    it("should require mandatory options", () => {
      expect(() => new QueueProducerService({})).toThrow();
      expect(() => new QueueProducerService({ queueName: "test" })).toThrow();
    });

    it("should initialize queue", async () => {
      await service.initialize();
      expect(Queue).toHaveBeenCalledWith(
        "test-queue",
        expect.objectContaining({
          connection: mockConnection,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queueName: "test-queue" }),
        expect.stringContaining("Queue initialized")
      );
    });

    it("should setup event handlers", async () => {
      await service.initialize();
      const queueInstance = Queue.mock.instances[0];
      expect(queueInstance.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
    });
  });

  describe("Job Management", () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it("should add job successfully", async () => {
      const jobData = { userId: "123" };
      const job = await service.addJob("test-job", jobData);

      expect(job).toEqual({ id: "job-123" });
      expect(Queue.mock.instances[0].add).toHaveBeenCalledWith(
        "test-job",
        jobData,
        expect.any(Object)
      );
    });

    it("should merge custom options with defaults", async () => {
      await service.addJob("test-job", {}, { priority: 1 });

      expect(Queue.mock.instances[0].add).toHaveBeenCalledWith(
        "test-job",
        {},
        expect.objectContaining({
          priority: 1,
          attempts: 3,
        })
      );
    });

    it("should handle job creation errors", async () => {
      Queue.mock.instances[0].add.mockRejectedValue(new Error("Add failed"));

      await expect(service.addJob("test-job", {})).rejects.toThrow(
        "Add failed"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should throw if queue not initialized", async () => {
      const uninitializedService = new QueueProducerService({
        queueName: "test",
        connection: {},
        logger: mockLogger,
        t: mockT,
      });

      await expect(uninitializedService.addJob("test", {})).rejects.toThrow(
        "Queue not initialized"
      );
    });
  });

  describe("Metrics", () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it("should return queue metrics", async () => {
      const metrics = await service.getMetrics();

      expect(metrics).toEqual({
        queueName: "test-queue",
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
      });
    });

    it("should return null if queue not initialized", async () => {
      const uninitializedService = new QueueProducerService({
        queueName: "test",
        connection: {},
        logger: mockLogger,
        t: mockT,
      });

      const metrics = await uninitializedService.getMetrics();
      expect(metrics).toBeNull();
    });
  });

  describe("Health", () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it("should return healthy status", async () => {
      const health = await service.getHealth();

      expect(health).toEqual({
        healthy: true,
        queueName: "test-queue",
        redis: {
          connected: true,
          latencyMs: expect.any(Number),
        },
        metrics: expect.any(Object),
        circuitBreaker: {
          state: "closed",
        },
      });
    });

    it("should return unhealthy if ping fails", async () => {
      Queue.mock.instances[0].client.ping.mockRejectedValue(
        new Error("Connection lost")
      );

      const health = await service.getHealth();

      expect(health).toEqual({
        healthy: false,
        reason: "Connection lost",
      });
    });

    it("should return unhealthy if not initialized", async () => {
      const uninitializedService = new QueueProducerService({
        queueName: "test",
        connection: {},
        logger: mockLogger,
        t: mockT,
      });

      const health = await uninitializedService.getHealth();
      expect(health).toEqual({
        healthy: false,
        reason: "Queue not initialized",
      });
    });
  });

  describe("Lifecycle", () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it("should pause queue", async () => {
      await service.pause();
      expect(Queue.mock.instances[0].pause).toHaveBeenCalled();
    });

    it("should resume queue", async () => {
      await service.resume();
      expect(Queue.mock.instances[0].resume).toHaveBeenCalled();
    });

    it("should close queue", async () => {
      await service.close();
      expect(Queue.mock.instances[0].close).toHaveBeenCalled();
    });
  });
});
