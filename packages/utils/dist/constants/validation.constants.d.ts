/**
 * Validation Rules and Constants
 *
 * Centralized validation configuration for consistent enforcement.
 * Uses `as const` for type safety.
 */
export declare const VALIDATION_RULES: {
    readonly NAME: {
        readonly MIN_LENGTH: 4;
        readonly MAX_LENGTH: 100;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 128;
    };
    /**
     * RFC 5322 compliant email regex
     *
     * Validates:
     * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
     * - Domain: alphanumeric, dots, hyphens
     * - TLD: 2-63 characters
     *
     * @see https://emailregex.com/
     */
    readonly EMAIL_REGEX: RegExp;
};
/**
 * Validation error messages (i18n keys)
 */
export declare const VALIDATION_MESSAGES: {
    readonly NAME: {
        readonly REQUIRED: "validation:name.required";
        readonly LENGTH: "validation:name.length";
    };
    readonly EMAIL: {
        readonly REQUIRED: "validation:email.required";
        readonly INVALID: "validation:email.invalid";
        readonly IN_USE: "validation:email.inUse";
    };
    readonly PASSWORD: {
        readonly REQUIRED: "validation:password.required";
        readonly LENGTH: "validation:password.length";
        readonly WEAK: "validation:password.weak";
    };
};
//# sourceMappingURL=validation.constants.d.ts.map