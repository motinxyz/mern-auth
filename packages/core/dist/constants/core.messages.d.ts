/**
 * Core Package Message Constants
 *
 * Centralized dev-facing messages for the core package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 *
 * Organized by feature:
 * - Registration messages
 * - Verification messages
 * - Token messages
 */
export declare const REGISTRATION_MESSAGES: {
    ORCHESTRATING_VERIFICATION: string;
    USER_CREATED: string;
    VERIFICATION_EMAIL_QUEUED: string;
    DUPLICATE_KEY_DETECTED: string;
    CREATE_TOKEN_FAILED: string;
    ADD_EMAIL_JOB_FAILED: string;
    SET_RATE_LIMIT_FAILED: string;
    MONGOOSE_VALIDATION_TRIGGERED: string;
};
export declare const REGISTRATION_ERRORS: {
    TOKEN_CREATION_FAILED: string;
    EMAIL_JOB_FAILED: string;
    RATE_LIMIT_FAILED: string;
    REGISTRATION_FAILED: string;
};
export declare const VERIFICATION_MESSAGES: {
    REDIS_KEY_CONSTRUCTED: string;
    TOKEN_FOUND_REDIS: string;
    USER_ALREADY_VERIFIED: string;
    VERIFY_SUCCESS: string;
    TOKEN_NOT_FOUND_REDIS: string;
    PARSE_REDIS_DATA_FAILED: string;
    USER_FROM_TOKEN_NOT_FOUND: string;
};
export declare const VERIFICATION_ERRORS: {
    INVALID_TOKEN: string;
    USER_NOT_FOUND: string;
    INVALID_DATA_FORMAT: string;
};
export declare const TOKEN_MESSAGES: {
    CREATING_TOKEN: string;
    TOKEN_STORED_REDIS: string;
    TOKEN_CREATION_FAILED: string;
};
export declare const TOKEN_ERRORS: {
    CREATION_FAILED: string;
    STORAGE_FAILED: string;
};
//# sourceMappingURL=core.messages.d.ts.map