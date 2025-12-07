import { describe, it, expect } from "vitest";
import { verificationSchema } from "./verification.validator.js";
describe("Verification Validator", () => {
    it("should pass with a valid token", () => {
        const validData = { token: "valid-token" };
        const result = verificationSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });
    it("should fail if token is missing", () => {
        const invalidData = {};
        const result = verificationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
    it("should fail if token is empty", () => {
        const invalidData = { token: "" };
        const result = verificationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
//# sourceMappingURL=verification.validator.test.js.map