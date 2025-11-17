import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiResponse } from '@auth/utils';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js'; // Import actual AuthService for registration
import { createContainer, asClass, asValue } from 'awilix';

// Mock dependencies that AuthController directly uses or instantiates
vi.mock('@auth/utils', () => ({
  ApiResponse: vi.fn(),
  HTTP_STATUS_CODES: {
    CREATED: 201,
    OK: 200,
  },
  VALIDATION_RULES: { // Added VALIDATION_RULES mock
    NAME: {
      MIN_LENGTH: 4,
    },
    PASSWORD: {
      MIN_LENGTH: 4,
    },
  },
}));

describe('Auth Controller', () => {
  let container;
  let req, res, next;
  let authController;
  let mockLogger;
  let mockRedisConnection;
  let mockT;
  let mockAuthService; // This will be the mocked instance of AuthService

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh container for each test
    container = createContainer();

    // Mock core dependencies
    mockLogger = {
      child: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    };
    mockRedisConnection = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    mockT = vi.fn((key) => key);

    // Mock AuthService
    mockAuthService = {
      registerNewUser: vi.fn(),
      verifyUserEmail: vi.fn(),
    };

    // Register mocks and actual services with the container
    container.register({
      logger: asValue(mockLogger),
      redisConnection: asValue(mockRedisConnection),
      t: asValue(mockT),
      authService: asValue(mockAuthService), // Register the mocked instance
      authController: asClass(AuthController).singleton(),
    });

    // Resolve AuthController from the container
    authController = container.resolve('authController');

    req = {
      body: {},
      query: {},
      t: vi.fn((key) => key), // Mock req.t for controller's internal usage
      locale: 'en',
    };
    res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('registerUser', () => {
    it('should register a user and return a 201 response', async () => {
      const userData = { name: 'Test User', email: 'test@example.com' };
      req.body = userData;
      mockAuthService.registerNewUser.mockResolvedValue(userData);

      await authController.registerUser(req, res, next);

      expect(mockAuthService.registerNewUser).toHaveBeenCalledWith(userData, req.locale);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(201, userData, 'auth:register.success'));
    });

    it('should call next with an error if registration fails', async () => {
      const error = new Error('Registration failed');
      req.body = { name: 'Test User', email: 'test@example.com' };
      mockAuthService.registerNewUser.mockRejectedValue(error);

      await authController.registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyEmail', () => {
    it('should verify an email and return a 200 response', async () => {
      const token = 'test_token';
      req.query = { token };
      const verificationResult = { status: 'VERIFIED' };
      mockAuthService.verifyUserEmail.mockResolvedValue(verificationResult);

      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, verificationResult, 'auth:verify.success'));
    });

    it('should call next with an error if email verification fails', async () => {
      const error = new Error('Verification failed');
      req.query = { token: 'test_token' };
      mockAuthService.verifyUserEmail.mockRejectedValue(error);

      await authController.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should return ALREADY_VERIFIED status if email is already verified', async () => {
      const token = 'test_token';
      req.query = { token };
      const verificationResult = { status: 'ALREADY_VERIFIED' };
      mockAuthService.verifyUserEmail.mockResolvedValue(verificationResult);

      await authController.verifyEmail(req, res, next);

      expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(token);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, verificationResult, 'auth:verify.alreadyVerified'));
    });
  });
});
