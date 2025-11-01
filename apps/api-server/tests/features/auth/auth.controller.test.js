import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser } from '@/features/auth/auth.controller.js';
import * as authService from '@/features/auth/auth.service.js';
import { ApiResponse, HTTP_STATUS_CODES } from '@auth/core';

// Mock the auth service using unstable_mockModule
vi.mock('@/features/auth/auth.service.js', () => ({
  registerNewUser: vi.fn(),
}));


describe('Auth Controller', () => {
  describe('registerUser', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: { name: 'Test User', email: 'test@example.com', password: 'password123' },
        t: (key) => key,
      };
      // Mock Express response object
      res = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);

      next = vi.fn();
      vi.clearAllMocks();
    });

    it('should call registerNewUserService and return a 201 response on success', async () => {
      const newUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      vi.spyOn(authService, 'registerNewUser').mockResolvedValue(newUser);

      await registerUser(req, res, next);

      expect(authService.registerNewUser).toHaveBeenCalledWith(req.body, req);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(HTTP_STATUS_CODES.CREATED, newUser, 'auth:register.success')
      );
      // Ensure next() is NOT called on success
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with the error if registerNewUserService throws an error', async () => {
      const error = new Error('Something went wrong');
      vi.spyOn(authService, 'registerNewUser').mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(authService.registerNewUser).toHaveBeenCalledWith(req.body, req);
      // Ensure res.status and res.json are NOT called on error
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});