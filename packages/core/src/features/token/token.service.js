import { config } from "@auth/config";
import crypto from "node:crypto";
import { TOKEN_REDIS_PREFIXES } from "@auth/config";
import { TokenCreationError, HASHING_ALGORITHM } from "@auth/utils";

export class TokenService {
  constructor({ logger, redisConnection, t }) {
    this.logger = logger.child({ module: "token-service" });
    this.redisConnection = redisConnection;
    this.t = t;
  }

  async createVerificationToken(user) {
    try {
      // Generate a secure, random token.
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create a hash of the token to be stored in Redis.
      const hashedToken = crypto
        .createHash(HASHING_ALGORITHM)
        .update(verificationToken)
        .digest("hex");

      const verifyKey = `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`;

      // Prepare the data to be stored.
      const userDataToStore = JSON.stringify({
        userId: user.id,
        email: user.email,
      });

      this.logger.info(
        { email: user.email, expiresIn: config.verificationTokenExpiresIn },
        this.t("token:creating")
      );

      // Store the token in Redis with expiration
      const result = await this.redisConnection.set(
        verifyKey,
        userDataToStore,
        "EX",
        config.verificationTokenExpiresIn
      );

      // Verify the token was stored correctly
      const ttl = await this.redisConnection.ttl(verifyKey);
      this.logger.debug(
        { key: verifyKey, ttl, redisResponse: result },
        this.t("token:stored")
      );

      return verificationToken;
    } catch (error) {
      this.logger.error({ err: error }, this.t("token:creationFailed"));
      // Wrap the original error in our custom error class for better context.
      throw new TokenCreationError(this.t("token:creationFailed"), error);
    }
  }
}
