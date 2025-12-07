import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationController } from "./registration.controller.js";

vi.mock("@auth/utils", () => ({
  ApiResponse: class {
    statusCode: any;
    data: any;
    message: any;
    constructor(statusCode: any, data: any, message: any) {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
    }
  },
  HTTP_STATUS_CODES: {
    CREATED: 201,
    OK: 200,
  },
}));

vi.mock("@auth/config", () => ({
  t: vi.fn((key) => key),
}));

describe("Registration Controller", () => {
  let registrationController: any;
  let mockRegistrationService: any;

  beforeEach(() => {
    mockRegistrationService = {
      register: vi.fn(),
    };

    registrationController = new RegistrationController(
      mockRegistrationService
    );
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a user and return a 201 response", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      const dto = { ...userData };
      const locale = "en";

      mockRegistrationService.register.mockResolvedValue(userData);

      const result = await registrationController.registerUser(dto, locale);

      expect(mockRegistrationService.register).toHaveBeenCalledWith(dto);
      expect(result.statusCode).toBe(201);
      expect(result.data.data).toEqual(userData);
    });
  });
});
