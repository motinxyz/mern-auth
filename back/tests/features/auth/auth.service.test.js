import { describe, it, expect, afterEach, vi } from 'vitest';
import User from '@/features/auth/user.model.js';
import { registerNewUser } from '@/features/auth/auth.service.js';
import * as redisClient from '@/startup/redisClient.js';
import * as tokenService from '@/features/token/token.service.js';
import * as queueService from '@/features/queue/queue.service.js';

// Mock the User model using unstable_mockModule
vi.mock('@/features/auth/user.model.js', () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock('@/startup/redisClient.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));
vi.mock('@/features/token/token.service.js');
vi.mock('@/features/queue/queue.service.js');

describe('Auth Service', () => {
  describe('registerNewUser', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should create and return a new user if email is not in use', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const req = { t: (key) => key, locale: 'en' }; // Mock the request object
      const mockUser = { ...userData, id: 'mock-id', toJSON: () => ({ ...userData, id: 'mock-id' }) };
      const mockToken = 'mock-verification-token';

      // Setup mocks
      vi.spyOn(redisClient.default, 'get').mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      vi.spyOn(tokenService, 'createVerificationToken').mockResolvedValue(mockToken);
      vi.spyOn(queueService, 'addEmailJob').mockResolvedValue(undefined);

      const result = await registerNewUser(userData, req);

      expect(User.create).toHaveBeenCalledWith(userData);
      expect(tokenService.createVerificationToken).toHaveBeenCalledWith(mockUser);
      expect(queueService.addEmailJob).toHaveBeenCalledWith(
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