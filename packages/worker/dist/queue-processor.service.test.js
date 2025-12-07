import { describe, it, expect, vi, beforeEach } from "vitest";
import QueueProcessorService from "./queue-processor.service.js";
import { Worker, Queue } from "bullmq";
// Mock BullMQ
vi.mock("bullmq", () => {
    const MockWorker = vi.fn();
    MockWorker.prototype.on = vi.fn();
    MockWorker.prototype.close = vi.fn().mockResolvedValue(undefined);
    MockWorker.prototype.pause = vi.fn().mockResolvedValue(undefined);
    MockWorker.prototype.resume = vi.fn().mockResolvedValue(undefined);
    MockWorker.prototype.isRunning = vi.fn().mockResolvedValue(true);
    MockWorker.prototype.isPaused = vi.fn().mockResolvedValue(false);
    const MockQueue = vi.fn();
    MockQueue.prototype.add = vi.fn().mockResolvedValue(undefined);
    MockQueue.prototype.close = vi.fn().mockResolvedValue(undefined);
    return {
        Worker: MockWorker,
        Queue: MockQueue,
    };
});
describe("QueueProcessorService", () => {
    let service;
    let mockOptions;
    let mockLogger;
    let mockT;
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogger = {
            child: vi.fn().mockReturnThis(),
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
        };
        mockT = vi.fn((key) => key);
        mockOptions = {
            queueName: "test-queue",
            connection: {},
            processor: vi.fn(),
            logger: mockLogger,
            t: mockT,
            workerConfig: {
                concurrency: 1,
                attempts: 3,
            },
        };
        service = new QueueProcessorService(mockOptions);
    });
    describe("Initialization", () => {
        it("should require mandatory options", () => {
            expect(() => new QueueProcessorService({})).toThrow();
        });
        it("should initialize worker", async () => {
            await service.initialize();
            expect(Worker).toHaveBeenCalledWith("test-queue", expect.any(Function), expect.objectContaining({
                connection: mockOptions.connection,
                concurrency: 1,
            }));
        });
        it("should initialize dead letter queue if configured", async () => {
            service = new QueueProcessorService({
                ...mockOptions,
                deadLetterQueueName: "dlq",
            });
            await service.initialize();
            expect(Queue).toHaveBeenCalledWith("dlq", expect.objectContaining({
                connection: mockOptions.connection,
            }));
        });
        it("should disable stalled job check if configured", async () => {
            service = new QueueProcessorService({
                ...mockOptions,
                workerConfig: {
                    ...mockOptions.workerConfig,
                    disableStalledJobCheck: true,
                    stalledInterval: 30000,
                },
            });
            await service.initialize();
            expect(Worker).toHaveBeenCalledWith("test-queue", expect.any(Function), expect.objectContaining({
            // stalledInterval should be undefined or not present when disabled
            // However, since we're mocking, we check that it's NOT in the object with the value
            // Or we can check the logic.
            // In the implementation:
            // if (!this.workerConfig.disableStalledJobCheck) { workerOptions.stalledInterval = ... }
            // So if disabled, stalledInterval key should be missing from options passed to Worker
            }));
            const workerOptions = Worker.mock.calls[Worker.mock.calls.length - 1][2];
            expect(workerOptions.stalledInterval).toBeUndefined();
        });
        it("should enable stalled job check by default", async () => {
            service = new QueueProcessorService({
                ...mockOptions,
                workerConfig: {
                    ...mockOptions.workerConfig,
                    disableStalledJobCheck: false,
                    stalledInterval: 30000,
                },
            });
            await service.initialize();
            const workerOptions = Worker.mock.calls[Worker.mock.calls.length - 1][2];
            expect(workerOptions.stalledInterval).toBe(30000);
        });
    });
    describe("Event Handlers", () => {
        let workerInstance;
        beforeEach(async () => {
            await service.initialize();
            workerInstance = Worker.mock.instances[0];
        });
        it("should handle failed jobs", async () => {
            // Find 'failed' handler
            const failedHandler = workerInstance.on.mock.calls.find((call) => call[0] === "failed")[1];
            const job = { id: "1", name: "job", attemptsMade: 1 };
            const error = new Error("fail");
            await failedHandler(job, error);
            expect(mockLogger.error).toHaveBeenCalled();
            expect(service.getMetrics().failed).toBe(1);
        });
        it("should move to DLQ on max attempts", async () => {
            service = new QueueProcessorService({
                ...mockOptions,
                deadLetterQueueName: "dlq",
                workerConfig: { attempts: 3 },
            });
            await service.initialize();
            workerInstance = Worker.mock.instances[1]; // New instance
            // Get the handler registered for this specific worker instance
            // Since 'on' is a prototype mock, calls are shared. We need the last one.
            const failedCalls = workerInstance.on.mock.calls.filter((call) => call[0] === "failed");
            const failedHandler = failedCalls[failedCalls.length - 1][1];
            const job = {
                id: "1",
                name: "job",
                attemptsMade: 3,
                data: { foo: "bar" },
            };
            const error = new Error("fail");
            await failedHandler(job, error);
            const dlqInstance = Queue.mock.instances[0];
            expect(dlqInstance.add).toHaveBeenCalledWith("job", { foo: "bar" }, expect.any(Object));
        });
    });
    describe("Health & Metrics", () => {
        beforeEach(async () => {
            await service.initialize();
        });
        it("should return health status", async () => {
            const health = await service.getHealth();
            expect(health).toEqual(expect.objectContaining({
                healthy: true,
                queueName: "test-queue",
            }));
        });
        it("should return metrics", () => {
            const metrics = service.getMetrics();
            expect(metrics).toEqual(expect.objectContaining({
                processed: 0,
                failed: 0,
                completed: 0,
            }));
        });
    });
    describe("Lifecycle", () => {
        beforeEach(async () => {
            await service.initialize();
        });
        it("should pause worker", async () => {
            await service.pause();
            expect(service.getWorker().pause).toHaveBeenCalled();
        });
        it("should resume worker", async () => {
            await service.resume();
            expect(service.getWorker().resume).toHaveBeenCalled();
        });
        it("should close worker", async () => {
            await service.close();
            expect(service.getWorker().close).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=queue-processor.service.test.js.map