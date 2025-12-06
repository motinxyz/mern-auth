/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 */
export class RegistrationDto {
  name: string;
  email: string;
  password: string;
  locale: string;

  constructor({ name, email, password, locale = "en" }: any) {
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
