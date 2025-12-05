/**
 * Data Transfer Object for email verification
 * Framework-agnostic - no Express dependencies
 */
export class VerificationDto {
  constructor({ token }) {
    this.token = token;
  }

  /**
   * Create DTO from Express request
   * @param {object} query - Request query parameters
   * @returns {VerificationDto}
   */
  static fromRequest(query) {
    return new VerificationDto({
      token: query.token,
    });
  }
}
