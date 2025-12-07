/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 */
export class RegistrationDto {
  name: string;
  email: string;
  password: string;
  locale: string;

  constructor({ name, email, password, locale = "en" }: { name: string; email: string; password: string; locale?: string }) {
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
  static fromRequest(body: Record<string, unknown>, locale: string) {
    return new RegistrationDto({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      locale: locale ?? "en",
    });
  }
}
