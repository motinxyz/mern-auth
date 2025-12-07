/**
 * Crypto Module
 *
 * Cryptographic utilities for hashing sensitive data.
 */
import crypto from "crypto";
/**
 * Hash sensitive data for safe inclusion in logs/span attributes
 *
 * @param value - The value to hash
 * @returns A truncated SHA-256 hash (first 16 chars)
 *
 * @example
 * ```typescript
 * const hashedEmail = hashSensitiveData("user@example.com");
 * // Returns: "a1b2c3d4e5f6g7h8"
 * ```
 */
export function hashSensitiveData(value) {
    if (value === undefined || value === null || value === "") {
        return "";
    }
    return crypto
        .createHash("sha256")
        .update(value.toLowerCase().trim())
        .digest("hex")
        .substring(0, 16);
}
/**
 * Generate a cryptographically secure random token
 *
 * @param length - The length of the token in bytes (default: 32)
 * @returns A hex-encoded random token
 *
 * @example
 * ```typescript
 * const token = generateSecureToken(32);
 * // Returns: "a1b2c3d4..."  (64 hex chars)
 * ```
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
}
/**
 * Compare two strings in constant time (timing-attack safe)
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 *
 * @example
 * ```typescript
 * const isValid = secureCompare(providedToken, storedToken);
 * ```
 */
export function secureCompare(a, b) {
    // Handle empty strings - both empty is equal, one empty is not
    if (a.length === 0 && b.length === 0) {
        return true;
    }
    if (a.length === 0 || b.length === 0) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
//# sourceMappingURL=index.js.map