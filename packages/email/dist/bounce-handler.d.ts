/**
 * Handle email bounce notifications
 * @param {object} emailLogRepository - Email log repository
 * @param {object} userRepository - User repository
 * @param {object} logger - Logger instance
 * @param {Function} t - Translation function
 * @param {object} bounceData - Bounce notification data
 */
export declare function handleBounce(emailLogRepository: any, userRepository: any, logger: any, t: any, bounceData: any): Promise<{
    success: boolean;
    reason: string;
    action?: undefined;
    emailLog?: undefined;
    user?: undefined;
} | {
    success: boolean;
    action: string;
    emailLog: any;
    reason?: undefined;
    user?: undefined;
} | {
    success: boolean;
    action: string;
    emailLog: any;
    user: any;
    reason?: undefined;
}>;
/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid
 */
export declare function isEmailValid(email: any): boolean;
declare const _default: {
    handleBounce: typeof handleBounce;
    isEmailValid: typeof isEmailValid;
};
export default _default;
//# sourceMappingURL=bounce-handler.d.ts.map