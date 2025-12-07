/**
 * Crypto Module
 *
 * Cryptographic utilities for hashing sensitive data.
 */
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
export declare function hashSensitiveData(value: string | undefined | null): string;
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
export declare function generateSecureToken(length?: number): string;
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
export declare function secureCompare(a: string, b: string): boolean;
//# sourceMappingURL=index.d.ts.map