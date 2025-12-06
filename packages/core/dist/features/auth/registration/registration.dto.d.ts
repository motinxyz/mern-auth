/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 */
export declare class RegistrationDto {
    name: string;
    email: string;
    password: string;
    locale: string;
    constructor({ name, email, password, locale }: any);
    /**
     * Create DTO from Express request
     * @param {object} body - Request body
     * @param {string} locale - User locale from request
     * @returns {RegistrationDto}
     */
    static fromRequest(body: any, locale: any): RegistrationDto;
}
//# sourceMappingURL=registration.dto.d.ts.map