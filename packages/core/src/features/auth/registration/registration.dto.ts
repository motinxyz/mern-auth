/**
 * Data Transfer Object for user registration
 * Framework-agnostic - no Express dependencies
 * Properties are readonly for immutability
 */
export class RegistrationDto {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly locale: string;

  constructor({ name, email, password, locale = "en" }: { name: string; email: string; password: string; locale?: string }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.locale = locale;
  }

  /**
   * Create DTO from Express request
   */
  static fromRequest(body: Record<string, unknown>, locale: string): RegistrationDto {
    return new RegistrationDto({
      name: String(body["name"] ?? ""),
      email: String(body["email"] ?? ""),
      password: String(body["password"] ?? ""),
      locale: locale ?? "en",
    });
  }
}
