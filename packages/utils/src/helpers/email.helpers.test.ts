/**
 * Email Helpers Tests
 */

import { describe, it, expect } from "vitest";
import {
    normalizeEmail,
    areEmailsEquivalent,
    getEmailDomain,
} from "./email.helpers.js";

describe("Email Helpers", () => {
    describe("normalizeEmail", () => {
        it("should lowercase email addresses", () => {
            expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
        });

        it("should remove dots from Gmail local part", () => {
            expect(normalizeEmail("john.doe@gmail.com")).toBe("johndoe@gmail.com");
            expect(normalizeEmail("j.o.h.n@gmail.com")).toBe("john@gmail.com");
        });

        it("should remove dots from Googlemail local part", () => {
            expect(normalizeEmail("john.doe@googlemail.com")).toBe(
                "johndoe@googlemail.com"
            );
        });

        it("should NOT remove dots from non-Gmail providers", () => {
            expect(normalizeEmail("john.doe@example.com")).toBe("john.doe@example.com");
            expect(normalizeEmail("john.doe@yahoo.com")).toBe("john.doe@yahoo.com");
        });

        it("should throw for empty email", () => {
            expect(() => normalizeEmail("")).toThrow("Email address is required");
        });

        it("should throw for invalid email format", () => {
            expect(() => normalizeEmail("notanemail")).toThrow(
                "Invalid email format: missing @ symbol"
            );
        });

        it("should trim whitespace", () => {
            expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
        });
    });

    describe("areEmailsEquivalent", () => {
        it("should return true for same email with different casing", () => {
            expect(areEmailsEquivalent("User@Example.com", "user@example.com")).toBe(
                true
            );
        });

        it("should return true for Gmail with and without dots", () => {
            expect(
                areEmailsEquivalent("john.doe@gmail.com", "johndoe@gmail.com")
            ).toBe(true);
        });

        it("should return false for different emails", () => {
            expect(
                areEmailsEquivalent("john@example.com", "jane@example.com")
            ).toBe(false);
        });

        it("should return false for invalid emails", () => {
            expect(areEmailsEquivalent("invalid", "also-invalid")).toBe(false);
        });
    });

    describe("getEmailDomain", () => {
        it("should extract the domain from an email", () => {
            expect(getEmailDomain("user@example.com")).toBe("example.com");
        });

        it("should lowercase the domain", () => {
            expect(getEmailDomain("user@EXAMPLE.COM")).toBe("example.com");
        });

        it("should throw for empty email", () => {
            expect(() => getEmailDomain("")).toThrow("Email address is required");
        });

        it("should throw for email without @", () => {
            expect(() => getEmailDomain("invalid")).toThrow(
                "Invalid email format: missing @ symbol"
            );
        });

        it("should throw for email with @ but no domain", () => {
            expect(() => getEmailDomain("user@")).toThrow(
                "Invalid email format: missing domain"
            );
        });
    });
});
