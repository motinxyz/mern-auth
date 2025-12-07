/**
 * Data Transfer Object for email verification
 * Framework-agnostic - no Express dependencies
 */
export class VerificationDto {
  token: string;

  constructor({ token }: { token: string }) {
    this.token = token;
  }

  /**
   * Create DTO from Express request
   * @param {object} query - Request query parameters
   * @returns {VerificationDto}
   */
  static fromRequest(query: Record<string, string>) {
    return new VerificationDto({
      token: query.token ?? "",
    });
  }
}
