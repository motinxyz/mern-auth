# @auth/worker

Production-grade worker service for processing background jobs using BullMQ.

## Features

- ✅ **Generic Queue Processing** - Process any type of background job
- ✅ **Health Checks** - Monitor worker and processor health
- ✅ **Metrics** - Track job processing statistics
- ✅ **Graceful Shutdown** - Handle SIGTERM/SIGINT signals
- ✅ **Dead Letter Queue** - Automatic retry with DLQ for failed jobs
- ✅ **Pause/Resume** - Control job processing dynamically
- ✅ **Structured Logging** - Production-grade observability

## Architecture

```
WorkerService (Orchestrator)
    ├── QueueProcessorService (Generic Processor)
    │   ├── Metrics tracking
    │   ├── Health monitoring
    │   └── Event handling
    └── Consumers (Domain-specific logic)
        └── email.consumer.js
```

## Installation

```bash
pnpm add @auth/worker
```

## Usage

### Basic Setup

```javascript
import WorkerService from '@auth/worker';
import { createEmailJobConsumer } from '@auth/worker/consumers/email';
import { QUEUE_NAMES, WORKER_CONFIG } from '@auth/config';

// Create worker service
const workerService = new WorkerService({
  logger,
  redisConnection,
  databaseService, // Optional
});

// Register a processor
workerService.registerProcessor({
  queueName: QUEUE_NAMES.EMAIL,
  processor: createEmailJobConsumer(emailService),
  workerConfig: WORKER_CONFIG,
  deadLetterQueueName: QUEUE_NAMES.EMAIL_DEAD_LETTER,
});

// Start processing
await workerService.start();

// Setup graceful shutdown
workerService.setupGracefulShutdown();
```

### Creating Custom Consumers

```javascript
// consumers/sms.consumer.js
export const createSmsJobConsumer = (smsService) => {
  if (!smsService) {
    throw new ConfigurationError('SMS service required');
  }

  return async (job) => {
    const { type, data } = job.data;
    
    switch (type) {
      case SMS_JOB_TYPES.SEND_OTP:
        await smsService.sendOTP(data.phone, data.code);
        return { status: 'OK' };
      
      default:
        throw new UnknownJobTypeError(`Unknown job type: ${type}`);
    }
  };
};
```

### Health Checks

```javascript
// Get health status
const health = await workerService.getHealth();
console.log(health);
// {
//   healthy: true,
//   processors: [{
//     healthy: true,
//     queueName: 'emailQueue',
//     isRunning: true,
//     isPaused: false,
//     metrics: { ... }
//   }],
//   database: { healthy: true }
// }
```

### Metrics

```javascript
// Get processing metrics
const metrics = workerService.getMetrics();
console.log(metrics);
// [{
//   queueName: 'emailQueue',
//   metrics: {
//     processed: 1250,
//     completed: 1200,
//     failed: 50,
//     active: 5,
//     averageProcessingTime: 245,
//     successRate: 96,
//     failureRate: 4
//   }
// }]
```

### Pause/Resume

```javascript
// Pause all processors
await workerService.pauseAll();

// Resume all processors
await workerService.resumeAll();

// Pause specific processor
const processor = workerService.getProcessors()[0];
await processor.pause();
await processor.resume();
```

## Configuration

### Worker Config

```javascript
import { WORKER_CONFIG } from '@auth/config';

// Default configuration
{
  concurrency: 5,              // Process 5 jobs concurrently
  attempts: 3,                 // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',       // Exponential backoff
    delay: 1000                // Start with 1 second
  },
  removeOnComplete: {
    count: 1000                // Keep last 1000 completed jobs
  },
  removeOnFail: {
    count: 5000                // Keep last 5000 failed jobs
  },
  stalledInterval: 60000,      // Check for stalled jobs every 60s
  lockDuration: 60000,         // Lock jobs for 60s
  drainDelay: 500              // Wait 500ms before draining
}
```

### Queue Names

```javascript
import { QUEUE_NAMES } from '@auth/config';

QUEUE_NAMES.EMAIL              // 'emailQueue'
QUEUE_NAMES.EMAIL_DEAD_LETTER  // 'emailDeadLetter'
```

### Job Types

```javascript
import { EMAIL_JOB_TYPES } from '@auth/config';

EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL  // 'sendVerificationEmail'
```

## Error Handling

The worker package uses custom error types for better error handling:

```javascript
import {
  ConfigurationError,
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError
} from '@auth/utils';

// Configuration errors
throw new ConfigurationError('Email service required');

// Unknown job types
throw new UnknownJobTypeError('Unknown job type: sendSMS');

// Invalid job data
throw new InvalidJobDataError('Missing required fields', [
  { field: 'email', message: 'is required' }
]);

// Email dispatch errors
throw new EmailDispatchError('Failed to send email', originalError);
```

## Logging

All logs use hardcoded English messages for DevOps observability:

```javascript
import { WORKER_MESSAGES, WORKER_ERRORS } from './constants/worker.messages.js';

// Success logs
logger.info(WORKER_MESSAGES.JOB_COMPLETED);
logger.info(WORKER_MESSAGES.WORKER_READY);

// Error logs
logger.error(WORKER_ERRORS.JOB_FAILED, error);
logger.fatal(WORKER_ERRORS.STARTUP_FAILED, error);
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test --coverage
```

## API Reference

### WorkerService

#### Constructor
```javascript
new WorkerService({ logger, redisConnection, databaseService?, initServices? })
```

#### Methods
- `registerProcessor(config)` - Register a queue processor
- `start()` - Start all processors
- `stop()` - Stop all processors gracefully
- `setupGracefulShutdown()` - Setup SIGTERM/SIGINT handlers
- `getHealth()` - Get health status
- `getMetrics()` - Get processing metrics
- `pauseAll()` - Pause all processors
- `resumeAll()` - Resume all processors
- `getProcessors()` - Get all registered processors

### QueueProcessorService

#### Constructor
```javascript
new QueueProcessorService({
  queueName,
  connection,
  processor,
  logger,
  workerConfig?,
  deadLetterQueueName?
})
```

#### Methods
- `initialize()` - Initialize the processor
- `close()` - Close the processor
- `getHealth()` - Get processor health
- `getMetrics()` - Get processing metrics
- `pause()` - Pause processing
- `resume()` - Resume processing

## License

Private - Internal use only
