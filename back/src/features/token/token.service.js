import config from "../../config/env.js";
import redisClient from "../../startup/redisClient.js";
import logger from "../../config/logger.js";
import crypto from "node:crypto";

const tokenServiceLogger = logger.child({ module: "token-service" });
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

    tokenServiceLogger.info({
      msg: "Creating verification token",
      email: user.email,
      expiresIn: config.verificationTokenExpiresIn,
    });

    // Store the token in Redis with expiration
    const result = await redisClient.set(
      verifyKey,
      userDataToStore,
      "EX",
      config.verificationTokenExpiresIn
    );

    // Verify the token was stored correctly
    const ttl = await redisClient.ttl(verifyKey);
    tokenServiceLogger.debug({
      msg: "Verification token stored in Redis",
      key: verifyKey,
      ttl,
      redisResponse: result,
    });

    return verificationToken;
  } catch (error) {
    tokenServiceLogger.error({
      msg: "Failed to create verification token",
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
