
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailJobConsumer } from './email.consumer.js';
import { sendVerificationEmail } from '@auth/email';
import { i18nInstance } from '@auth/config';
import {
  UnknownJobTypeError,
  InvalidJobDataError,
  EmailDispatchError,
  EMAIL_JOB_TYPES,
} from '@auth/utils';

// Mock dependencies
vi.mock('@auth/email', () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@auth/config', () => ({
  i18nInstance: {
    getFixedT: vi.fn().mockResolvedValue(vi.fn((key) => key)),
  },
  t: vi.fn((key) => key),
}));

describe('Email Job Consumer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SEND_VERIFICATION_EMAIL', () => {
    const job = {
      data: {
        type: EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
        data: {
          user: { name: 'Test User', email: 'test@example.com' },
          token: 'test_token',
          locale: 'en',
        },
      },
    };

    it('should send a verification email successfully', async () => {
      const result = await emailJobConsumer(job);
      expect(sendVerificationEmail).toHaveBeenCalledWith(job.data.data.user, job.data.data.token, expect.any(Function));
      expect(result).toEqual({ status: "OK", message: "worker:logs.emailSentSuccess" });
    });

    it('should throw InvalidJobDataError if user is missing', async () => {
      const invalidJob = { ...job, data: { ...job.data, data: { ...job.data.data, user: undefined } } };
      await expect(emailJobConsumer(invalidJob)).rejects.toThrow(InvalidJobDataError);
    });

    it('should throw EmailDispatchError if sending email fails', async () => {
      const error = new Error('Email dispatch failed');
      sendVerificationEmail.mockRejectedValue(error);
      await expect(emailJobConsumer(job)).rejects.toThrow(EmailDispatchError);
    });

    it('should throw InvalidJobDataError if token is missing', async () => {
      const invalidJob = { ...job, data: { ...job.data, data: { ...job.data.data, token: undefined } } };
      await expect(emailJobConsumer(invalidJob)).rejects.toThrow(InvalidJobDataError);
    });

    it('should throw InvalidJobDataError if locale is missing', async () => {
      const invalidJob = { ...job, data: { ...job.data, data: { ...job.data.data, locale: undefined } } };
      await expect(emailJobConsumer(invalidJob)).rejects.toThrow(InvalidJobDataError);
    });

    it('should throw InvalidJobDataError if multiple fields are missing', async () => {
      const invalidJob = { ...job, data: { ...job.data, data: { user: undefined, token: undefined, locale: undefined } } };
      await expect(emailJobConsumer(invalidJob)).rejects.toThrow(InvalidJobDataError);
    });
  });

  it('should throw UnknownJobTypeError for an unknown job type', async () => {
    const job = {
      data: {
        type: 'UNKNOWN_JOB_TYPE',
        data: {},
      },
    };
    await expect(emailJobConsumer(job)).rejects.toThrow(UnknownJobTypeError);
  });
});
