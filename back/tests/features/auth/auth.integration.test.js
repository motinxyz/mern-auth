import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "@/app.js";
import User from "@/features/auth/user.model.js";
import { HTTP_STATUS_CODES } from "@/constants/httpStatusCodes.js";

describe("Auth Integration Tests", () => {
  // In a real-world scenario, you would connect to a test database.
  // For this example, we'll mock the Mongoose User model methods.
  beforeAll(() => {
    // This would be your test DB connection logic
    // await mongoose.connect(process.env.TEST_MONGO_URI);
  });

  afterEach(async () => {
    // This would clear your test DB
    // await User.deleteMany({});
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // This would close the connection
    // await mongoose.connection.close();
  });

  describe("POST /api/v1/auth/register", () => {
    const validUserData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    it("should register a new user and return 201 CREATED", async () => {
      // Mock the database interaction for this test
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      vi.spyOn(User, "create").mockImplementation((user) =>
        Promise.resolve({
          ...user,
          id: "mock-id",
          _id: "mock-id",
          toJSON: () => ({ id: "mock-id", name: user.name, email: user.email }),
        })
      );

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(HTTP_STATUS_CODES.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully.");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.name).toBe(validUserData.name);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should return 409 CONFLICT if email is already in use", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(validUserData);

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(HTTP_STATUS_CODES.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("This email address is already in use.");
    });

    it("should return 400 BAD REQUEST for invalid data (e.g., short password)", async () => {
      const invalidUserData = {
        ...validUserData,
        password: "123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidUserData)
        .expect(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid data format. See details below...");
      expect(response.body.errors[0].message).toBe("Password must be at least 4 characters long.");
      expect(response.body.errors[0].field).toBe("password");
    });

    it("should return 422 UNPROCESSABLE_CONTENT if name is missing", async () => {
      const { name, ...userDataWithoutName } = validUserData;

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userDataWithoutName)
        .expect(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].field).toBe("name");
    });

    it("should return 422 UNPROCESSABLE_CONTENT if email is missing", async () => {
      const { email, ...userDataWithoutEmail } = validUserData;

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userDataWithoutEmail)
        .expect(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].field).toBe("email");
    });

    it("should return 422 UNPROCESSABLE_CONTENT if password is missing", async () => {
      const { password, ...userDataWithoutPassword } = validUserData;

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userDataWithoutPassword)
        .expect(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].field).toBe("password");
    });

    it("should return 422 UNPROCESSABLE_CONTENT if email is invalid", async () => {
      const invalidEmailUserData = { ...validUserData, email: "invalid-email" };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidEmailUserData)
        .expect(HTTP_STATUS_CODES.UNPROCESSABLE_CONTENT);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].field).toBe("email");
    });
  });
});