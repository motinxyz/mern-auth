import { jest } from '@jest/globals';

// Mock the User model using unstable_mockModule
jest.unstable_mockModule('@/features/auth/user.model.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Dynamically import the modules after mocking
const { default: User } = await import('@/features/auth/user.model.js');
const { registerNewUser } = await import('@/features/auth/auth.service.js');
const { ConflictError } = await import('@/errors/index.js');


describe('Auth Service', () => {
  describe('registerNewUser', () => {
    afterEach(() => {
      jest.clearAllMocks();
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

      await expect(registerNewUser(userData, req)).rejects.toThrow(ConflictError);
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
  });
});