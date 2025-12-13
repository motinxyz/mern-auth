import { describe, it, expect } from "vitest";
import { HttpError } from "./HttpError.js";
import { BaseError } from "./BaseError.js";
import { ERROR_CODES, HTTP_STATUS_CODES } from "../../index.js";

describe("BaseError", () => {
    class TestError extends BaseError {
        constructor() {
            super("Test Error", ERROR_CODES.INTERNAL_ERROR);
        }
    }

    it("should carry code and cause", () => {
        const error = new TestError();
        expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        expect(error.message).toBe("Test Error");
        expect(error).toBeInstanceOf(Error);
    });

    it("should serialize to JSON", () => {
        const error = new TestError();
        const json = error.toJSON();
        expect(json).toEqual({
            message: "Test Error",
            code: ERROR_CODES.INTERNAL_ERROR,
            stack: expect.any(String),
            name: "TestError",
            timestamp: expect.any(String),
            cause: undefined,
        });
    });
});

describe("HttpError", () => {
    it("should have correct properties", () => {
        const errors = [{ field: "email", message: "invalid" }];
        const error = new HttpError(
            HTTP_STATUS_CODES.BAD_REQUEST,
            "Bad Request",
            ERROR_CODES.VALIDATION_FAILED,
            errors
        );

        expect(error.statusCode).toBe(400);
        expect(error.errors).toEqual(errors);
        expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
        expect(error).toBeInstanceOf(BaseError);
    });

    it("should format response correctly", () => {
        const error = new HttpError(404, "Not Found", ERROR_CODES.NOT_FOUND);
        const response = error.toResponse();

        expect(response).toEqual({
            success: false,
            statusCode: 404,
            message: "Not Found",
            code: ERROR_CODES.NOT_FOUND,
            errors: [],
            data: null,
        });
    });

    it("should serialize to JSON correctly", () => {
        const error = new HttpError(404, "Not Found", ERROR_CODES.NOT_FOUND);
        const json = error.toJSON();

        expect(json).toMatchObject({
            message: "Not Found",
            statusCode: 404,
            code: ERROR_CODES.NOT_FOUND,
            success: false,
        });
    });
});
