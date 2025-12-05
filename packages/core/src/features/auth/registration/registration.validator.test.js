import { describe, it, expect } from "vitest";
import { registrationSchema } from "./registration.validator.js";

describe("Registration Validator", () => {
  it("should pass with valid data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };
    const result = registrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail if name is missing", () => {
    const invalidData = {
      email: "john@example.com",
      password: "password123",
    };
    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should fail if email is invalid", () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      password: "password123",
    };
    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should fail if password is too short", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      password: "123",
    };
    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
