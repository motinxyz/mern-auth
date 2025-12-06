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
export function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return email;
  }

  const [localPart, domain] = email.toLowerCase().split("@");

  if (!domain) {
    return email.toLowerCase();
  }

  // Gmail and Googlemail ignore dots in local part
  const gmailDomains = ["gmail.com", "googlemail.com"];

  if (gmailDomains.includes(domain)) {
    // Remove all dots from local part for Gmail
    const normalizedLocal = localPart.replace(/\./g, "");
    return `${normalizedLocal}@${domain}`;
  }

  // For other providers, just lowercase
  return email.toLowerCase();
}

/**
 * Check if two emails are equivalent (considering provider-specific rules)
 *
 * @param {string} email1 - First email
 * @param {string} email2 - Second email
 * @returns {boolean} True if emails are equivalent
 */
export function areEmailsEquivalent(email1, email2) {
  return normalizeEmail(email1) === normalizeEmail(email2);
}
