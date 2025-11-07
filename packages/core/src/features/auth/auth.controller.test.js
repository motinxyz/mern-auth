
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, verifyEmail } from './auth.controller.js';
import { registerNewUser, verifyUserEmail as verifyUserEmailService } from './auth.service.js';
import { ApiResponse } from '@auth/utils';

// Mock dependencies
vi.mock('./auth.service.js', () => ({
  registerNewUser: vi.fn(),
  verifyUserEmail: vi.fn(),
}));

vi.mock('@auth/utils', () => ({
  ApiResponse: vi.fn(),
  HTTP_STATUS_CODES: {
    CREATED: 201,
    OK: 200,
  },
}));

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      t: vi.fn((key) => key),
    };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user and return a 201 response', async () => {
      const userData = { name: 'Test User', email: 'test@example.com' };
      req.body = userData;
      registerNewUser.mockResolvedValue(userData);

      await registerUser(req, res, next);

      expect(registerNewUser).toHaveBeenCalledWith(userData, req);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(201, userData, 'auth:register.success'));
    });

    it('should call next with an error if registration fails', async () => {
      const error = new Error('Registration failed');
      req.body = { name: 'Test User', email: 'test@example.com' };
      registerNewUser.mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyEmail', () => {
    it('should verify an email and return a 200 response', async () => {
      const token = 'test_token';
      req.query = { token };
      const verificationResult = { status: 'VERIFIED' };
      // Correctly mock the imported verifyUserEmail service function
      vi.mocked(verifyUserEmailService).mockResolvedValue(verificationResult);

      await verifyEmail(req, res, next);

      expect(verifyUserEmailService).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, verificationResult, 'auth:verify.success'));
    });

    it('should call next with an error if email verification fails', async () => {
      const error = new Error('Verification failed');
      req.query = { token: 'test_token' };
      // Correctly mock the imported verifyUserEmail service function
      vi.mocked(verifyUserEmailService).mockRejectedValue(error);

      await verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should return ALREADY_VERIFIED status if email is already verified', async () => {
      const token = 'test_token';
      req.query = { token };
      const verificationResult = { status: 'ALREADY_VERIFIED' };
      vi.mocked(verifyUserEmailService).mockResolvedValue(verificationResult);

      await verifyEmail(req, res, next);

      expect(verifyUserEmailService).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, verificationResult, 'auth:verify.alreadyVerified'));
    });
  });
});
