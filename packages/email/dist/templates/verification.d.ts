/**
 * Sends a verification email to a user.
 * @param {object} emailService - Email service instance
 * @param {object} user - User object containing email and name
 * @param {string} token - Verification token
 * @param {Function} t - Translation function
 * @param {object} config - Configuration object
 * @param {object} logger - Logger instance
 * @returns {Promise<object>} - Result from sendEmail
 */
export declare const sendVerificationEmail: (emailService: any, user: any, token: any, t: any, config: any, logger: any) => Promise<any>;
declare const _default: {
    sendVerificationEmail: (emailService: any, user: any, token: any, t: any, config: any, logger: any) => Promise<any>;
};
export default _default;
//# sourceMappingURL=verification.d.ts.map