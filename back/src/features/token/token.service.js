import config from "../../config/env.js";
import redisClient from "../../startup/redisClient.js";
import logger from "../../config/logger.js";
import crypto from "node:crypto";
import { getTranslator } from "../../config/i18n.js";
import { TokenCreationError } from "../../errors/index.js";

const tokenServiceLogger = logger.child({ module: "token-service" });

// Initialize a system translator for token-service logs and messages.
const systemT = await getTranslator("en");
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

    // Define the Redis key for the token.
    const verifyKey = `verify:${verificationToken}`;

    // Prepare the data to be stored.
    const userDataToStore = JSON.stringify({
      userId: user.id,
      email: user.email,
    });

    tokenServiceLogger.info(
      { email: user.email, expiresIn: config.verificationTokenExpiresIn },
      systemT("common:token.creating")
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
      systemT("common:token.stored")
    );

    return verificationToken;
  } catch (error) {
    tokenServiceLogger.error(
      { err: error },
      systemT("common:token.creationFailed")
    );
    // Wrap the original error in our custom error class for better context.
    throw new TokenCreationError(systemT("common:token.creationFailed"), error);
  }
};
