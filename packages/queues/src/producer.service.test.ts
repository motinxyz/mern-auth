import { describe, it, expect, vi, beforeEach } from "vitest";
import ProducerService from "./producer.service.js";

describe("ProducerService", () => {
  let service;
  let mockQueueService;
  let mockLogger;
  let mockT;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueueService = {
      addJob: vi.fn().mockResolvedValue({ id: "job-123" }),
    };

    mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    mockT = vi.fn((key) => key);

    service = new ProducerService({
      queueService: mockQueueService,
      logger: mockLogger,
      t: mockT,
    });
  });

  describe("Initialization", () => {
    it("should require mandatory options", () => {
      expect(() => new ProducerService({})).toThrow();
      expect(
        () => new ProducerService({ queueService: mockQueueService })
      ).toThrow();
    });

    it("should create child logger", () => {
      expect(mockLogger.child).toHaveBeenCalledWith({ module: "producer" });
    });
  });

  describe("addJob", () => {
    it("should add job successfully", async () => {
      const jobData = { userId: "123" };
      const job = await service.addJob("test-job", jobData);

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        { type: "test-job", data: jobData },
        {}
      );
      expect(job).toEqual(expect.objectContaining({ id: "job-123" }));
      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should pass custom options", async () => {
      await service.addJob("test-job", {}, { priority: 1 });

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { priority: 1 }
      );
    });

    it("should handle errors", async () => {
      mockQueueService.addJob.mockRejectedValue(new Error("Add failed"));

      await expect(service.addJob("test-job", {})).rejects.toThrow(
        "Add failed"
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("addJobWithDeduplication", () => {
    it("should add job with jobId for deduplication", async () => {
      await service.addJobWithDeduplication(
        "test-job",
        { userId: "123" },
        "unique-key-123"
      );

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { jobId: "unique-key-123" }
      );
    });

    it("should merge custom options with jobId", async () => {
      await service.addJobWithDeduplication("test-job", {}, "key", {
        priority: 1,
      });

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { jobId: "key", priority: 1 }
      );
    });
  });

  describe("addDelayedJob", () => {
    it("should add job with delay", async () => {
      await service.addDelayedJob("test-job", { userId: "123" }, 5000);

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { delay: 5000 }
      );
    });

    it("should merge custom options with delay", async () => {
      await service.addDelayedJob("test-job", {}, 5000, { priority: 1 });

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { delay: 5000, priority: 1 }
      );
    });
  });

  describe("addPriorityJob", () => {
    it("should add job with priority", async () => {
      await service.addPriorityJob("test-job", { userId: "123" }, 1);

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { priority: 1 }
      );
    });

    it("should merge custom options with priority", async () => {
      await service.addPriorityJob("test-job", {}, 1, { delay: 1000 });

      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        "test-job",
        expect.any(Object),
        { priority: 1, delay: 1000 }
      );
    });
  });
});
