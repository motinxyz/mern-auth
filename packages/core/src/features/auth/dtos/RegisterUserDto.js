/**
 * Data Transfer Object for User Registration.
 * Encapsulates the data required to register a new user.
 */
export class RegisterUserDto {
  constructor({ name, email, password, locale }) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.locale = locale;
  }

  /**
   * Factory method to create a RegisterUserDto from an Express request.
   * @param {import('express').Request} req - The Express request object.
   * @returns {RegisterUserDto} The populated DTO.
   */
  static fromRequest(req) {
    return new RegisterUserDto({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      locale: req.locale, // Assuming locale is attached to req by i18n middleware
    });
  }
}
