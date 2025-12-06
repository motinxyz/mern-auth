import { ApiResponse } from "@auth/utils";
/**
 * Controller for user registration
 * Single Responsibility: Handle registration HTTP requests
 */
export declare class RegistrationController {
    registrationService: any;
    constructor(registrationService: any);
    /**
     * Register a new user
     * @param {RegisterUserDto} dto - User registration data
     * @param {string} locale - User locale for i18n
     * @returns {Promise<ControllerResult>}
     */
    registerUser(dto: any, locale?: string): Promise<{
        statusCode: number;
        data: ApiResponse<any>;
    }>;
}
//# sourceMappingURL=registration.controller.d.ts.map