/**
 * Email Normalization Utilities
 *
 * Handles provider-specific email normalization for duplicate detection.
 */
/**
 * Normalize an email address for duplicate detection
 *
 * Handles provider-specific normalization:
 * - Gmail/Googlemail: removes dots from local part
 * - All emails: lowercased
 *
 * @param email - Email address to normalize
 * @returns Normalized email address
 * @throws {Error} If email is invalid
 *
 * @example
 * ```typescript
 * normalizeEmail("John.Doe@Gmail.com"); // "johndoe@gmail.com"
 * normalizeEmail("User.Name@example.com"); // "user.name@example.com"
 * ```
 */
export declare function normalizeEmail(email: string): string;
/**
 * Check if two emails are equivalent (considering provider-specific rules)
 *
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns True if emails are equivalent
 *
 * @example
 * ```typescript
 * areEmailsEquivalent("john.doe@gmail.com", "johndoe@gmail.com"); // true
 * areEmailsEquivalent("user@example.com", "USER@example.com"); // true
 * ```
 */
export declare function areEmailsEquivalent(email1: string, email2: string): boolean;
/**
 * Extract the domain from an email address
 *
 * @param email - Email address
 * @returns Domain part of the email
 * @throws {Error} If email is invalid
 *
 * @example
 * ```typescript
 * getEmailDomain("user@example.com"); // "example.com"
 * ```
 */
export declare function getEmailDomain(email: string): string;
//# sourceMappingURL=email.helpers.d.ts.map