import { ApiResponse } from "@auth/utils";
/**
 * Controller for email verification
 * Single Responsibility: Handle email verification HTTP requests
 */
export declare class VerificationController {
    verificationService: any;
    constructor(verificationService: any);
    /**
     * Verify user email
     * @param {VerifyEmailDto} dto - Email verification data
     * @param {string} locale - User locale for i18n
     * @returns {Promise<ControllerResult>}
     */
    verifyEmail(dto: any, locale?: string): Promise<{
        statusCode: number;
        data: ApiResponse<{
            status: any;
        }>;
    }>;
}
//# sourceMappingURL=verification.controller.d.ts.map