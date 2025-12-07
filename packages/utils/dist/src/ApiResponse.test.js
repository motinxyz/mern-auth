import { describe, it, expect } from "vitest";
import ApiResponse from "./ApiResponse.js";
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
    it("should use default message if not provided", () => {
        const data = { user: { id: 1, name: "Test" } };
        const response = new ApiResponse(200, data);
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual(data);
        expect(response.message).toBe("success");
        expect(response.success).toBe(true);
    });
    it("should set success to false for error status codes", () => {
        const response = new ApiResponse(400, null, "Bad Request");
        expect(response.statusCode).toBe(400);
        expect(response.success).toBe(false);
    });
});
//# sourceMappingURL=ApiResponse.test.js.map