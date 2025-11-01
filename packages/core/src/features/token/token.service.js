import config from "../../config/env.js";
import redisClient from "../../startup/redisClient.js";
import logger from "../../config/logger.js";
import crypto from "node:crypto";
import { t as systemT } from "../../config/system-logger.js";
import { TokenCreationError } from "../../errors/index.js";
import { TOKEN_REDIS_PREFIXES, HASHING_ALGORITHM } from "./token.constants.js";

const tokenServiceLogger = logger.child({ module: "token-service" });

// Initialize a system translator for token-service logs and messages.
/**
 * Creates a verification token for a user and stores it in Redis.
 *redisLogger
 * @param {object} user - The user object containing id and email.
 * @returns {Promise<string>} A promise that resolves to the generated verification token.
 */
export const createVerificationToken = async (user) => {
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

    tokenServiceLogger.info(
      { email: user.email, expiresIn: config.verificationTokenExpiresIn },
      systemT("token:creating")
    );

    // Store the token in Redis with expiration
    const result = await redisClient.set(
      verifyKey,
      userDataToStore,
      "EX",
      config.verificationTokenExpiresIn
    );

    // Verify the token was stored correctly
    const ttl = await redisClient.ttl(verifyKey);
    tokenServiceLogger.debug(
      { key: verifyKey, ttl, redisResponse: result },
      systemT("token:stored")
    );

    return verificationToken;
  } catch (error) {
    tokenServiceLogger.error({ err: error }, systemT("token:creationFailed"));
    // Wrap the original error in our custom error class for better context.
    throw new TokenCreationError(systemT("token:creationFailed"), error);
  }
};