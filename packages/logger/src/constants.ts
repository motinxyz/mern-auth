/**
 * Sensitive fields to redact from logs
 */
export const REDACT_PATHS = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "*.password",
    "*.token",
    "*.secret",
];
