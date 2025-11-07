import { describe, it, expect } from "vitest";
import ApiError from "./ApiError.js";

describe("ApiError", () => {
  it("should create an error with correct properties", () => {
    const error = new ApiError(404, "Not Found", ["id not found"]);

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Not Found");
    expect(error.success).toBe(false);
    expect(error.errors).toEqual(["id not found"]);
    expect(error.stack).toBeDefined();
  });

  it("should use default message if not provided", () => {
    const error = new ApiError(500);
    expect(error.message).toBe("Something went wrong");
  });

  it("should use 500 as default status code if not provided", () => {
    const error = new ApiError(undefined, "Test Error");
    expect(error.statusCode).toBe(500);
  });

  it("should use provided stack if available", () => {
    const error = new ApiError(500, "Test Error", [], "custom stack");
    expect(error.stack).toBe("custom stack");
  });
});