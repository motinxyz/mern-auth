import { HTTP_STATUS_CODES, ApiResponse } from "@auth/utils";
import { t as systemT } from "@auth/config";
import type { RegistrationService } from "./registration.service.js";
import { RegistrationDto } from "./registration.dto.js";

/**
 * Controller for user registration
 * Single Responsibility: Handle registration HTTP requests
 */
export class RegistrationController {
  private readonly registrationService: RegistrationService;

  constructor(registrationService: RegistrationService) {
    this.registrationService = registrationService;
  }

  /**
   * Register a new user
   * @param {RegistrationDto} dto - User registration data
   * @param {string} locale - User locale for i18n
   * @returns {Promise<ControllerResult>}
   */
  async registerUser(dto: RegistrationDto, locale = "en") {
    const user = await this.registrationService.register(dto);

    return {
      statusCode: HTTP_STATUS_CODES.CREATED,
      data: new ApiResponse(
        HTTP_STATUS_CODES.CREATED,
        user,
        systemT("auth:register.success", { lng: locale })
      ),
    };
  }
}
