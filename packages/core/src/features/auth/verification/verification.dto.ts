/**
 * Data Transfer Object for email verification
 * Framework-agnostic - no Express dependencies
 * Properties are readonly for immutability
 */
export class VerificationDto {
  readonly token: string;

  constructor({ token }: { token: string }) {
    this.token = token;
  }

  /**
   * Create DTO from Express request
   */
  static fromRequest(query: Record<string, string>): VerificationDto {
    return new VerificationDto({
      token: query["token"] ?? "",
    });
  }
}
