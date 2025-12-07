/**
 * Email Normalization Utilities
 *
 * Handles provider-specific email normalization for duplicate detection.
 */
/**
 * List of domains that ignore dots in the local part
 */
const DOT_IGNORING_DOMAINS = ["gmail.com", "googlemail.com"];
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
export function normalizeEmail(email) {
    if (!email || typeof email !== "string") {
        throw new Error("Email address is required");
    }
    const trimmed = email.trim().toLowerCase();
    const atIndex = trimmed.lastIndexOf("@");
    if (atIndex === -1) {
        throw new Error("Invalid email format: missing @ symbol");
    }
    const localPart = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    if (!localPart || !domain) {
        throw new Error("Invalid email format");
    }
    // Gmail and Googlemail ignore dots in local part
    if (DOT_IGNORING_DOMAINS.includes(domain)) {
        const normalizedLocal = localPart.replace(/\./g, "");
        return `${normalizedLocal}@${domain}`;
    }
    return trimmed;
}
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
export function areEmailsEquivalent(email1, email2) {
    try {
        return normalizeEmail(email1) === normalizeEmail(email2);
    }
    catch {
        return false;
    }
}
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
export function getEmailDomain(email) {
    if (!email || typeof email !== "string") {
        throw new Error("Email address is required");
    }
    const atIndex = email.lastIndexOf("@");
    if (atIndex === -1) {
        throw new Error("Invalid email format: missing @ symbol");
    }
    const domain = email.slice(atIndex + 1).toLowerCase();
    if (!domain) {
        throw new Error("Invalid email format: missing domain");
    }
    return domain;
}
//# sourceMappingURL=email.helpers.js.map