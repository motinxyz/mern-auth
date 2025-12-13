/**
 * Crypto Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
    hashSensitiveData,
    generateSecureToken,
    secureCompare,
} from "./index.js";

describe("Crypto Utilities", () => {
    describe("hashSensitiveData", () => {
        it("should hash a string to 16 character hex", () => {
            const hash = hashSensitiveData("test@example.com");
            expect(hash).toHaveLength(16);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });

        it("should return empty string for null/undefined/empty", () => {
            expect(hashSensitiveData(null)).toBe("");
            expect(hashSensitiveData(undefined)).toBe("");
            expect(hashSensitiveData("")).toBe("");
        });

        it("should produce consistent hashes", () => {
            const hash1 = hashSensitiveData("test@example.com");
            const hash2 = hashSensitiveData("test@example.com");
            expect(hash1).toBe(hash2);
        });

        it("should be case-insensitive", () => {
            const hash1 = hashSensitiveData("Test@Example.COM");
            const hash2 = hashSensitiveData("test@example.com");
            expect(hash1).toBe(hash2);
        });

        it("should trim whitespace", () => {
            const hash1 = hashSensitiveData("  test@example.com  ");
            const hash2 = hashSensitiveData("test@example.com");
            expect(hash1).toBe(hash2);
        });
    });

    describe("generateSecureToken", () => {
        it("should generate a token with default length (32 bytes = 64 hex chars)", () => {
            const token = generateSecureToken();
            expect(token).toHaveLength(64);
            expect(token).toMatch(/^[a-f0-9]+$/);
        });

        it("should generate a token with custom length", () => {
            const token = generateSecureToken(16);
            expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
        });

        it("should generate unique tokens", () => {
            const token1 = generateSecureToken();
            const token2 = generateSecureToken();
            expect(token1).not.toBe(token2);
        });
    });

    describe("secureCompare", () => {
        it("should return true for identical strings", () => {
            expect(secureCompare("abc123", "abc123")).toBe(true);
        });

        it("should return false for different strings of same length", () => {
            expect(secureCompare("abc123", "abc124")).toBe(false);
        });

        it("should return false for strings of different lengths", () => {
            expect(secureCompare("abc", "abcd")).toBe(false);
        });

        it("should return true for empty strings", () => {
            expect(secureCompare("", "")).toBe(true);
        });
    });
});
