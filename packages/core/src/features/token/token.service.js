import { config, logger, t as systemT } from "@auth/config";
import { redisConnection } from "@auth/config";
import crypto from "node:crypto";
import { TokenCreationError, HASHING_ALGORITHM } from "@auth/utils";

const tokenServiceLogger = logger.child({ module: "token-service" });

export const createVerificationToken = async (user) => {
  try {
    // Generate a secure, random token.
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create a hash of the token to be stored in Redis.
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(verificationToken)
      .digest("hex");

    const verifyKey = `${config.redis.prefixes.verifyEmail}${hashedToken}`;

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
    const result = await redisConnection.set(
      verifyKey,
      userDataToStore,
      "EX",
      config.verificationTokenExpiresIn
    );

    // Verify the token was stored correctly
    const ttl = await redisConnection.ttl(verifyKey);
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
