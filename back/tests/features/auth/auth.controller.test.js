import { jest } from '@jest/globals';

// Mock the auth service using unstable_mockModule
jest.unstable_mockModule('@/features/auth/auth.service.js', () => ({
  registerNewUser: jest.fn(),
}));

// Dynamically import the modules after mocking
const { registerUser } = await import('@/features/auth/auth.controller.js');
const { registerNewUser: registerNewUserService } = await import('@/features/auth/auth.service.js');
const { default: ApiResponse } = await import('@/utils/ApiResponse.js');
const { HTTP_STATUS_CODES } = await import('@/constants/httpStatusCodes.js');


describe('Auth Controller', () => {
  describe('registerUser', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: { name: 'Test User', email: 'test@example.com', password: 'password123' },
        t: (key) => key,
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
      jest.clearAllMocks();
    });

    it('should call registerNewUserService and return a 201 response on success', async () => {
      const newUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      registerNewUserService.mockResolvedValue(newUser);

      await registerUser(req, res, next);

      expect(registerNewUserService).toHaveBeenCalledWith(req.body, req);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(HTTP_STATUS_CODES.CREATED, newUser, 'auth.register.success')
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with the error if registerNewUserService throws an error', async () => {
      const error = new Error('Something went wrong');
      registerNewUserService.mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(registerNewUserService).toHaveBeenCalledWith(req.body, req);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});