/**
 * Centralized constants for the authentication feature.
 */
export const VERIFICATION_STATUS = Object.freeze({
    VERIFIED: "VERIFIED",
    ALREADY_VERIFIED: "ALREADY_VERIFIED",
});
export const RATE_LIMIT_DURATIONS = Object.freeze({
    VERIFY_EMAIL: 180, // 3 minutes in seconds
});
export const REDIS_RATE_LIMIT_VALUE = "1";
//# sourceMappingURL=auth.constants.js.map