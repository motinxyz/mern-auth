import { describe, it, expect, afterEach, vi } from 'vitest';
import User from '@/features/auth/user.model.js';
import { registerNewUser } from '@/features/auth/auth.service.js';
import { ConflictError } from '@/errors/index.js';

// Mock the User model using unstable_mockModule
vi.mock('@/features/auth/user.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

describe('Auth Service', () => {
  describe('registerNewUser', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should create and return a new user if email is not in use', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const req = { t: (key) => key }; // Mock the request object with t function

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(userData);

      const result = await registerNewUser(userData, req);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(userData);
    });

    it('should throw a ConflictError if email is already in use', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const req = { t: (key) => key }; // Mock the request object with t function

      User.findOne.mockResolvedValue(userData);

      await expect(registerNewUser(userData, req)).rejects.toThrow(
        new ConflictError("validation:emailInUse", [
          {
            field: "email",
            message: "validation:emailInUse",
            value: userData.email,
          },
        ])
      );
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
  });
});