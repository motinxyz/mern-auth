
import { describe, it, expect } from 'vitest';
import { registerSchema, verifyEmailSchema } from './auth.validation.js';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    const validData = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    };

    it('should pass with valid data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if name is missing', () => {
      const invalidData = { ...validData, body: { ...validData.body, name: undefined } };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail if email is invalid', () => {
      const invalidData = { ...validData, body: { ...validData.body, email: 'invalid-email' } };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail if password is too short', () => {
      const invalidData = { ...validData, body: { ...validData.body, password: '123' } };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    const validData = {
      query: {
        token: 'some_token',
      },
    };

    it('should pass with a valid token', () => {
      const result = verifyEmailSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if token is missing', () => {
      const invalidData = { query: {} };
      const result = verifyEmailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail if token is empty', () => {
      const invalidData = { query: { token: '' } };
      const result = verifyEmailSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
