/**
 * Email normalization utilities
 * Handles provider-specific email normalization (e.g., Gmail dot ignoring)
 */
/**
 * Normalize Gmail addresses by removing dots from local part
 * Gmail treats john.doe@gmail.com and johndoe@gmail.com as the same address
 *
 * @param {string} email - Email address to normalize
 * @returns {string} Normalized email address
 */
export declare function normalizeEmail(email: string): string;
/**
 * Check if two emails are equivalent (considering provider-specific rules)
 *
 * @param {string} email1 - First email
 * @param {string} email2 - Second email
 * @returns {boolean} True if emails are equivalent
 */
export declare function areEmailsEquivalent(email1: string, email2: string): boolean;
//# sourceMappingURL=email.helpers.d.ts.map