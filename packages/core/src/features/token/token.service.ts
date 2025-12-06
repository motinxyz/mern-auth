import crypto from "node:crypto";
import { TokenCreationError } from "@auth/utils";
import type { ILogger, IConfig, ICacheService } from "@auth/contracts";
import { HASHING_ALGORITHM } from "@auth/core/constants/token.constants";
import { TOKEN_MESSAGES } from "../../constants/core.messages.js";

interface UserIdentity {
  _id: string | { toString(): string };
  email: string;
}

/**
 * TokenService
 *
 * Handles all token-related operations for the authentication system.
 * Follows production-grade patterns with dependency injection.
 *
 * @implements {import('@auth/contracts').ITokenService}
 */
export class TokenService {
  redis: ICacheService;
  config: IConfig;
  logger: ILogger;

  constructor({ redis, config, logger }: { redis: ICacheService; config: IConfig; logger: ILogger }) {
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
  async createVerificationToken(user: UserIdentity) {
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
   * Verify and consume a token
   */
  async verifyToken(token: string): Promise<{ userId: string; type: string }> {
    throw new Error("Method not implemented.");
  }

  /**
   * Delete a token
   */
  async deleteToken(token: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /**
   * Future methods can be added here:
   * - createPasswordResetToken(user)
   * - createRefreshToken(user)
   * - validateToken(token, type)
   * - revokeToken(token)
   */
}
