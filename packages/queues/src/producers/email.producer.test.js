
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addEmailJob } from './email.producer.js';
import emailQueue from '../email.queue.js';
import { JobCreationError } from '@auth/utils';

// Mock dependencies
vi.mock('../email.queue.js', () => ({
  default: {
    add: vi.fn(),
  },
}));

vi.mock('@auth/config', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
    })),
  },
  t: vi.fn((key) => key),
}));

describe('Email Producer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a job to the email queue', async () => {
    const jobData = { to: 'test@example.com', subject: 'Test', text: 'Test email' };
    const job = { id: '123', data: jobData };
    emailQueue.add.mockResolvedValue(job);

    const result = await addEmailJob('SEND_EMAIL', jobData);

    expect(emailQueue.add).toHaveBeenCalledWith(
      'SEND_EMAIL',
      { type: 'SEND_EMAIL', data: jobData },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );
    expect(result).toBe(job);
  });

  it('should throw a JobCreationError if adding a job fails', async () => {
    const error = new Error('Queue error');
    emailQueue.add.mockRejectedValue(error);

    await expect(addEmailJob('SEND_EMAIL', {})).rejects.toThrow(JobCreationError);
  });
});
