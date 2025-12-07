import { HTTP_STATUS_CODES, ApiResponse } from "@auth/utils";
import { t as systemT } from "@auth/config";
import type { VerificationService } from "./verification.service.js";
import type { VerificationDto } from "./verification.dto.js";

/**
 * Controller for email verification
 * Single Responsibility: Handle email verification HTTP requests
 */
export class VerificationController {
  verificationService: VerificationService;

  constructor(verificationService: VerificationService) {
    this.verificationService = verificationService;
  }

  /**
   * Verify user email
   * @param {VerificationDto} dto - Email verification data
   * @param {string} locale - User locale for i18n
   * @returns {Promise<ControllerResult>}
   */
  async verifyEmail(dto: VerificationDto, locale = "en") {
    const { status } = await this.verificationService.verify(dto.token);

    const message =
      status === "ALREADY_VERIFIED"
        ? "auth:verify.alreadyVerified"
        : "auth:verify.success";

    return {
      statusCode: HTTP_STATUS_CODES.OK,
      data: new ApiResponse(
        HTTP_STATUS_CODES.OK,
        { status },
        systemT(message, { lng: locale })
      ),
    };
  }
}
