/**
 * ITokenService - Abstract interface for token operations
 *
 * Implementations: TokenService
 *
 * @abstract
 */
export class ITokenService {
  /**
   * Create a verification token for a user
   * @param {object} user - User object with _id
   * @returns {Promise<string>} - Generated token
   */
  async createVerificationToken(user) {
    throw new Error(
      "ITokenService.createVerificationToken() must be implemented"
    );
  }

  /**
   * Verify and consume a token
   * @param {string} token - Token to verify
   * @returns {Promise<{userId: string, type: string}>} - Token payload
   */
  async verifyToken(token) {
    throw new Error("ITokenService.verifyToken() must be implemented");
  }

  /**
   * Delete a token
   * @param {string} token - Token to delete
   * @returns {Promise<void>}
   */
  async deleteToken(token) {
    throw new Error("ITokenService.deleteToken() must be implemented");
  }
}
