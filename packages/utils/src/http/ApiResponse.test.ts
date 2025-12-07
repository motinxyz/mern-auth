/**
 * ApiResponse Tests
 */

import { describe, it, expect } from "vitest";
import { ApiResponse } from "./index.js";

describe("ApiResponse", () => {
  it("should create a success response with correct properties", () => {
    const data = { user: { id: 1, name: "Test" } };
    const message = "User fetched successfully";
    const response = new ApiResponse(200, data, message);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual(data);
    expect(response.message).toBe(message);
    expect(response.success).toBe(true);
  });

  it("should use default i18n message if not provided", () => {
    const data = { user: { id: 1, name: "Test" } };
    const response = new ApiResponse(200, data);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual(data);
    expect(response.message).toBe("system:success");
    expect(response.success).toBe(true);
  });

  it("should set success to false for error status codes", () => {
    const response = new ApiResponse(400, null, "Bad Request");
    expect(response.statusCode).toBe(400);
    expect(response.success).toBe(false);
  });

  it("should provide static factory methods", () => {
    const okResponse = ApiResponse.ok({ id: 1 });
    expect(okResponse.statusCode).toBe(200);
    expect(okResponse.message).toBe("system:success");

    const createdResponse = ApiResponse.created({ id: 2 });
    expect(createdResponse.statusCode).toBe(201);
    expect(createdResponse.message).toBe("system:created");

    const noContentResponse = ApiResponse.noContent();
    expect(noContentResponse.statusCode).toBe(204);
    expect(noContentResponse.data).toBeNull();
  });

  it("should serialize to JSON correctly", () => {
    const response = new ApiResponse(200, { id: 1 }, "test");
    const json = response.toJSON();

    expect(json).toEqual({
      success: true,
      statusCode: 200,
      message: "test",
      data: { id: 1 },
    });
  });
});
