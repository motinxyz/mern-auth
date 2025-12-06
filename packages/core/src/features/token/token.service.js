import crypto from "node:crypto";
import { TokenCreationError } from "@auth/utils";
import { HASHING_ALGORITHM } from "@auth/core/constants/token.constants";
import { TOKEN_MESSAGES } from "../../constants/core.messages.js";
import { ITokenService } from "@auth/contracts";

/**
 * TokenService
 *
 * Handles all token-related operations for the authentication system.
 * Follows production-grade patterns with dependency injection.
 *
 * @extends ITokenService
 */
export class TokenService extends ITokenService {
  constructor({ redis, config, logger }) {
    super();
    this.redis = redis;
    this.config = config;
    this.logger = logger.child({ module: "token-service" });
  }

  /**
   * Create a verification token for email verification
   *
   * @param {Object} user - User object containing _id and email
   * @returns {Promise<string>} - The verification token (unhashed)
   * @throws {TokenCreationError} - If token creation fails
   */
  async createVerificationToken(user) {
    try {
      // Generate a secure, random token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create a hash of the token to be stored in Redis
      const hashedToken = crypto
        .createHash(HASHING_ALGORITHM)
        .update(verificationToken)
        .digest("hex");

      const verifyKey = `${this.config.redis.prefixes.verifyEmail}${hashedToken}`;

      // Prepare the data to be stored
      const userDataToStore = JSON.stringify({
        userId: user._id.toString(),
        email: user.email,
      });

      this.logger.info(
        {
          email: user.email,
          expiresIn: this.config.verificationTokenExpiresIn,
        },
        TOKEN_MESSAGES.CREATING_TOKEN
      );

      // Store the token in Redis with expiration
      const result = await this.redis.set(
        verifyKey,
        userDataToStore,
        "EX",
        this.config.verificationTokenExpiresIn
      );

      // Verify the token was stored correctly
      const ttl = await this.redis.ttl(verifyKey);
      this.logger.debug(
        { key: verifyKey, ttl, redisResponse: result },
        TOKEN_MESSAGES.TOKEN_STORED_REDIS
      );

      return verificationToken;
    } catch (error) {
      this.logger.error({ err: error }, TOKEN_MESSAGES.TOKEN_CREATION_FAILED);

      // Wrap the original error in our custom error class for better context
      throw new TokenCreationError("Token creation failed", error);
    }
  }

  /**
   * Future methods can be added here:
   * - createPasswordResetToken(user)
   * - createRefreshToken(user)
   * - validateToken(token, type)
   * - revokeToken(token)
   */
}
