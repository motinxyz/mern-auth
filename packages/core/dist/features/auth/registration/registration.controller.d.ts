import { ApiResponse } from "@auth/utils";
import type { RegistrationService } from "./registration.service.js";
import { RegistrationDto } from "./registration.dto.js";
/**
 * Controller for user registration
 * Single Responsibility: Handle registration HTTP requests
 */
export declare class RegistrationController {
    registrationService: RegistrationService;
    constructor(registrationService: RegistrationService);
    /**
     * Register a new user
     * @param {RegistrationDto} dto - User registration data
     * @param {string} locale - User locale for i18n
     * @returns {Promise<ControllerResult>}
     */
    registerUser(dto: RegistrationDto, locale?: string): Promise<{
        statusCode: number;
        data: ApiResponse<any>;
    }>;
}
//# sourceMappingURL=registration.controller.d.ts.map