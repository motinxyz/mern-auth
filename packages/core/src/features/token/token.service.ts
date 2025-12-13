import crypto from "node:crypto";
import { TokenCreationError, NotFoundError } from "@auth/utils";
import type { ILogger, IConfig, ICacheService, ITokenService, TokenPayload } from "@auth/contracts";
import { HASHING_ALGORITHM } from "../../constants/token.constants.js";
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
 */
export class TokenService implements ITokenService {
  private readonly redis: ICacheService;
  private readonly config: IConfig;
  private readonly logger: ILogger;

  constructor({ redis, config, logger }: { redis: ICacheService; config: IConfig; logger: ILogger }) {
    this.redis = redis;
    this.config = config;
    this.logger = logger.child({ module: "token-service" });
  }

  /**
   * Create a verification token for email verification
   */
  async createVerificationToken(user: UserIdentity): Promise<string> {
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
        type: "verification",
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
        { ttl, redisResponse: result },
        TOKEN_MESSAGES.TOKEN_STORED_REDIS
      );

      // Business event: token created successfully
      this.logger.info(
        { email: user.email, expiresInSeconds: ttl },
        "Verification token created"
      );

      return verificationToken;
    } catch (error) {
      this.logger.error({ err: error }, TOKEN_MESSAGES.TOKEN_CREATION_FAILED);
      throw new TokenCreationError("Token creation failed", error as Error);
    }
  }

  /**
   * Verify a token and return its payload
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(token)
      .digest("hex");

    const verifyKey = `${this.config.redis.prefixes.verifyEmail}${hashedToken}`;
    const tokenData = await this.redis.get(verifyKey);

    if (tokenData === null || tokenData === undefined) {
      throw new NotFoundError("auth:verify.invalidToken");
    }

    const parsed = JSON.parse(tokenData) as { userId: string; type?: string };

    // Business event: token verified successfully
    this.logger.info(
      { userId: parsed.userId, tokenType: parsed.type ?? "verification" },
      "Token verified successfully"
    );

    return {
      userId: parsed.userId,
      type: parsed.type ?? "verification",
    };
  }

  /**
   * Delete a token from Redis
   */
  async deleteToken(token: string): Promise<void> {
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(token)
      .digest("hex");

    const verifyKey = `${this.config.redis.prefixes.verifyEmail}${hashedToken}`;
    await this.redis.del(verifyKey);

    // Business event: token deleted
    this.logger.info("Token deleted successfully");
  }
}
