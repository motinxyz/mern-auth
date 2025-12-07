/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 */
export class RegistrationDto {
    name;
    email;
    password;
    locale;
    constructor({ name, email, password, locale = "en" }) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.locale = locale;
    }
    /**
     * Create DTO from Express request
     * @param {object} body - Request body
     * @param {string} locale - User locale from request
     * @returns {RegistrationDto}
     */
    static fromRequest(body, locale) {
        return new RegistrationDto({
            name: String(body.name ?? ""),
            email: String(body.email ?? ""),
            password: String(body.password ?? ""),
            locale: locale ?? "en",
        });
    }
}
//# sourceMappingURL=registration.dto.js.map