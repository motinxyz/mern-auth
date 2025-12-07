
import { describe, it, expect } from "vitest";
import {
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    NotFoundError,
    TooManyRequestsError,
    ServiceUnavailableError,
    ValidationError,
} from "../../index.js";
import { ERROR_CODES, HTTP_STATUS_CODES } from "../../index.js";
import { HttpError } from "../base/HttpError.js";

describe("Additional HTTP Errors", () => {
    it("should instantiate UnauthorizedError", () => {
        const error = new UnauthorizedError();
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.UNAUTHORIZED);
        expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it("should instantiate ForbiddenError", () => {
        const error = new ForbiddenError();
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.FORBIDDEN);
        expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    it("should instantiate ConflictError", () => {
        const error = new ConflictError("Conflict");
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.CONFLICT);
    });

    it("should instantiate NotFoundError", () => {
        const error = new NotFoundError("Not Found");
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND);
    });

    it("should instantiate TooManyRequestsError", () => {
        const error = new TooManyRequestsError();
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.TOO_MANY_REQUESTS);
    });

    it("should instantiate ServiceUnavailableError", () => {
        const error = new ServiceUnavailableError();
        expect(error).toBeInstanceOf(HttpError);
        expect(error.statusCode).toBe(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE);
    });

    describe("ValidationError", () => {
        it("should handle Zod-style issues", () => {
            const error = new ValidationError([
                { path: ["user", "email"], message: "Invalid email" },
            ]);
            expect(error.errors[0]).toEqual({
                field: "user.email",
                message: "Invalid email",
            });
        });

        it("should handle custom issues with context", () => {
            const error = new ValidationError([
                { message: "Too short", context: { min: 5 } },
            ]);
            expect(error.errors[0]).toEqual({
                field: "unknown",
                message: "Too short",
                context: { min: 5 },
            });
        });

        it("should handle custom issues without context", () => {
            const error = new ValidationError([{ message: "Error" }]);
            expect(error.errors[0]).toEqual({
                field: "unknown",
                message: "Error",
            });
        });
    });
});

