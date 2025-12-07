import { ApiResponse } from "@auth/utils";
import type { VerificationService } from "./verification.service.js";
import type { VerificationDto } from "./verification.dto.js";
/**
 * Controller for email verification
 * Single Responsibility: Handle email verification HTTP requests
 */
export declare class VerificationController {
    verificationService: VerificationService;
    constructor(verificationService: VerificationService);
    /**
     * Verify user email
     * @param {VerificationDto} dto - Email verification data
     * @param {string} locale - User locale for i18n
     * @returns {Promise<ControllerResult>}
     */
    verifyEmail(dto: VerificationDto, locale?: string): Promise<{
        statusCode: number;
        data: ApiResponse<{
            status: "VERIFIED" | "ALREADY_VERIFIED";
        }>;
    }>;
}
//# sourceMappingURL=verification.controller.d.ts.map