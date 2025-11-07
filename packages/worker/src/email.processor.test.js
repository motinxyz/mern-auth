
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies using vi.doMock to ensure they are mocked before any import
vi.doMock('bullmq', () => {
  const MockWorker = vi.fn();
  const MockQueue = vi.fn();
  MockQueue.prototype.add = vi.fn();
  MockWorker.prototype.on = vi.fn();
  MockWorker.prototype.close = vi.fn();
  return { Worker: MockWorker, Queue: MockQueue };
});

vi.doMock('./consumers/email.consumer.js', () => ({
  emailJobConsumer: vi.fn(),
}));

vi.doMock('@auth/config', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
    })),
  },
  t: vi.fn((key) => key),
}));

vi.doMock('@auth/queues', () => ({
  redisConnection: {},
  QUEUE_NAMES: {
    EMAIL: 'email',
    EMAIL_DEAD_LETTER: 'email-dead-letter',
  },
  WORKER_CONFIG: {
    CONCURRENCY: 5,
    JOB_RETENTION: {
      REMOVE_ON_COMPLETE_COUNT: 1000,
      REMOVE_ON_FAIL_COUNT: 5000,
    },
    RATE_LIMIT: {
      MAX_JOBS: 100,
      DURATION: 1000,
    },
  },
}));

describe('Email Processor', () => {
  let Worker, emailJobConsumer, Queue;
  let emailProcessorInstance;

  beforeEach(async () => {
    // Reset modules to ensure mocks are fresh for each test
    vi.resetModules();

    // Dynamically import mocked modules
    const bullmq = await import('bullmq');
    Worker = bullmq.Worker;
    Queue = bullmq.Queue;
    const consumer = await import('./consumers/email.consumer.js');
    emailJobConsumer = consumer.emailJobConsumer;

    // Dynamically import the module under test AFTER mocks are set up
    const processorModule = await import('./email.processor.js');
    emailProcessorInstance = processorModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a worker with the correct parameters', () => {
    expect(Worker).toHaveBeenCalledTimes(1);
    // The second argument to the Worker constructor is the processor function
    expect(Worker.mock.calls[0][1]).toBeInstanceOf(Function);
  });

  it('should call emailJobConsumer when the processor function is executed', async () => {
    const job = { id: '1', data: { type: 'test' } };
    const processorFn = Worker.mock.calls[0][1]; // Get the processor function
    await processorFn(job);
    expect(emailJobConsumer).toHaveBeenCalledWith(job);
  });

  it('should register event listeners for failed, completed, and ready', () => {
    expect(emailProcessorInstance.on).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(emailProcessorInstance.on).toHaveBeenCalledWith('completed', expect.any(Function));
    expect(emailProcessorInstance.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });

  it("should move a failed job to the dead-letter queue on 'failed' event", async () => {
    const job = { id: '1', name: 'test-job', data: { type: 'test' } };
    const error = new Error('Processing failed');

    // Find the 'failed' event callback
    const failedCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'failed')[1];
    await failedCallback(job, error);

    // Since Queue is a constructor, we check the methods on its prototype
    expect(Queue.prototype.add).toHaveBeenCalledWith(job.name, job.data, { lifo: true });
  });

  it("should not move a failed job if job is null on 'failed' event", async () => {
    const error = new Error('Processing failed');

    // Find the 'failed' event callback
    const failedCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'failed')[1];
    await failedCallback(null, error);

    // Since Queue is a constructor, we check the methods on its prototype
    expect(Queue.prototype.add).not.toHaveBeenCalled();
  });

  it("should log a message on 'completed' event", async () => {
    const job = { id: '1', name: 'test-job', data: { type: 'test' } };
    const result = { status: "OK" };

    const { workerLogger } = await import('./email.processor.js');
    const infoSpy = vi.spyOn(workerLogger, 'info');

    // Find the 'completed' event callback
    const completedCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'completed')[1];
    await completedCallback(job, result);

    // Check that the logger was called
    expect(infoSpy).toHaveBeenCalledWith(
      { job: { id: job.id }, result },
      "worker:logs.completed"
    );
  });

  it("should log a message on 'ready' event", async () => {
    const { workerLogger } = await import('./email.processor.js');
    const infoSpy = vi.spyOn(workerLogger, 'info');

    // Find the 'ready' event callback
    const readyCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'ready')[1];
    await readyCallback();

    // Check that the logger was called
    expect(infoSpy).toHaveBeenCalledWith("Email processor is ready for jobs.");
  });

  it("should not move a failed job if job is null on 'failed' event", async () => {
    const error = new Error('Processing failed');

    // Find the 'failed' event callback
    const failedCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'failed')[1];
    await failedCallback(null, error);

    // Since Queue is a constructor, we check the methods on its prototype
    expect(Queue.prototype.add).not.toHaveBeenCalled();
  });

  it("should log a message on 'completed' event", async () => {
    const job = { id: '1', name: 'test-job', data: { type: 'test' } };
    const result = { status: "OK" };

    const { workerLogger } = await import('./email.processor.js');
    const infoSpy = vi.spyOn(workerLogger, 'info');

    // Find the 'completed' event callback
    const completedCallback = emailProcessorInstance.on.mock.calls.find(call => call[0] === 'completed')[1];
    await completedCallback(job, result);

    // Check that the logger was called
    expect(infoSpy).toHaveBeenCalledWith(
      { job: { id: job.id }, result },
      "worker:logs.completed"
    );
  });
});
