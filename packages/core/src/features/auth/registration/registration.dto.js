/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 */
export class RegistrationDto {
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
      name: body.name,
      email: body.email,
      password: body.password,
      locale: locale || "en",
    });
  }
}
