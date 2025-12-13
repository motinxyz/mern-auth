/**
 * Redis Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
    createAuthRateLimitKey,
    createVerifyEmailKey,
    createSessionKey,
} from "./index.js";

describe("Redis Utilities", () => {
    describe("createAuthRateLimitKey", () => {
        it("should create a valid rate limit key", () => {
            const key = createAuthRateLimitKey("ratelimit:verify:", "user@example.com");
            expect(key).toBe("ratelimit:verify:user@example.com");
        });

        it("should throw if prefix is empty", () => {
            expect(() => createAuthRateLimitKey("", "user@example.com")).toThrow(
                "Redis key prefix is required"
            );
        });

        it("should throw if identifier is empty", () => {
            expect(() => createAuthRateLimitKey("ratelimit:", "")).toThrow(
                "Redis key identifier is required"
            );
        });
    });

    describe("createVerifyEmailKey", () => {
        it("should create a valid verify email key", () => {
            const key = createVerifyEmailKey("token:verify:", "abc123hash");
            expect(key).toBe("token:verify:abc123hash");
        });

        it("should throw if prefix is empty", () => {
            expect(() => createVerifyEmailKey("", "abc123")).toThrow(
                "Redis key prefix is required"
            );
        });

        it("should throw if hashed token is empty", () => {
            expect(() => createVerifyEmailKey("token:", "")).toThrow(
                "Hashed token is required"
            );
        });
    });

    describe("createSessionKey", () => {
        it("should create a valid session key", () => {
            const key = createSessionKey("session:", "sess_abc123");
            expect(key).toBe("session:sess_abc123");
        });

        it("should throw if prefix is empty", () => {
            expect(() => createSessionKey("", "sess_123")).toThrow(
                "Redis key prefix is required"
            );
        });

        it("should throw if session ID is empty", () => {
            expect(() => createSessionKey("session:", "")).toThrow(
                "Session ID is required"
            );
        });
    });
});
