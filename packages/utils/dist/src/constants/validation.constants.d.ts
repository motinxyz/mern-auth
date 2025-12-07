/**
 * Validation rules and constants
 */
export declare const VALIDATION_RULES: {
    NAME: {
        MIN_LENGTH: number;
    };
    PASSWORD: {
        MIN_LENGTH: number;
    };
    /**
     * Stricter email regex that prevents:
     * - Consecutive dots (..)
     * - Leading or trailing dots
     * - Special characters at start/end of local part
     * - Invalid domain formats
     *
     * Valid: user@example.com, user.name@example.com, user+tag@example.co.uk
     * Invalid: user..name@example.com, .user@example.com, user.@example.com
     */
    EMAIL_REGEX: RegExp;
};
//# sourceMappingURL=validation.constants.d.ts.map