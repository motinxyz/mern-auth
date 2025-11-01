import { describe, it, expect, afterEach, vi } from 'vitest';
import User from '@/features/auth/user.model.js';
import { registerNewUser } from '@/features/auth/auth.service.js';

// Mock the User model using unstable_mockModule
vi.mock('@/features/auth/user.model.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

// Mock the entire @auth/core package
vi.mock('@auth/core', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    redisClient: { get: vi.fn(), set: vi.fn() }, // Mock redisClient
    createVerificationToken: vi.fn(), // Mock token service function
    addEmailJob: vi.fn(), // Mock queue service function
    getTranslator: () => (key) => key, // Mock translator
  };
});

describe('Auth Service', () => {
  describe('registerNewUser', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should create and return a new user if email is not in use', async () => {
      // Import the mocked module inside the test case to ensure mocks are applied.
      const { redisClient, createVerificationToken, addEmailJob } = await import('@auth/core');

      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const req = { t: (key) => key, locale: 'en' }; // Mock the request object
      const mockUser = { ...userData, id: 'mock-id', toJSON: () => ({ ...userData, id: 'mock-id' }) };
      const mockToken = 'mock-verification-token';

      // Setup mocks
      redisClient.get.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      createVerificationToken.mockResolvedValue(mockToken);
      addEmailJob.mockResolvedValue(undefined);

      const result = await registerNewUser(userData, req);

      expect(User.create).toHaveBeenCalledWith(userData);
      expect(createVerificationToken).toHaveBeenCalledWith(mockUser);
      expect(addEmailJob).toHaveBeenCalledWith(
        "sendVerificationEmail",
        expect.objectContaining({
          token: mockToken,
          locale: 'en',
        })
      );
      expect(result).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        id: 'mock-id',
      });
    });
  });
});