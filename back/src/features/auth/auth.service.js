import User from "./user.model.js";
import { TooManyRequestsError, NotFoundError } from "../../errors/index.js";
import crypto from "node:crypto";
import redisClient from "../../startup/redisClient.js";
import { createVerificationToken } from "../token/token.service.js";
import { addEmailJob } from "../queue/queue.service.js";
import { EMAIL_JOB_TYPES } from "../queue/queue.constants.js";
import {
  REDIS_KEY_PREFIXES as TOKEN_REDIS_PREFIXES,
  HASHING_ALGORITHM,
} from "../token/token.constants.js";
import {
  REDIS_KEY_PREFIXES as AUTH_REDIS_PREFIXES,
  VERIFICATION_STATUS,
  RATE_LIMIT_DURATIONS,
} from "./auth.constants.js";
import logger from "../../config/logger.js";
import { t as systemT } from "../../config/system-logger.js";

const authServiceLogger = logger.child({ module: "auth-service" });
/**
 * Registers a new user.
 *
 * @param {object} userData - The user data.
 * @param {string} userData.name - The user's name.
 * @param {string} userData.email - The user's email address.
 * @param {string} userData.password - The user's password.
 * @param {Request} req - The Express request object, used for translations.
 * @returns {Promise<object>} A promise that resolves to the created user object.
 */
export const registerNewUser = async (userData, req) => {
  const { email } = userData;

  // This rate limit specifically prevents spamming the "send verification email" step.
  const rateLimitKey = `${AUTH_REDIS_PREFIXES.VERIFY_EMAIL_RATE_LIMIT}${email}`;

  if (await redisClient.get(rateLimitKey)) {
    throw new TooManyRequestsError();
  }

  // Create the user in the database
  const newUser = await User.create(userData);

  try {
    // Orchestrate the verification flow by calling the appropriate services.
    authServiceLogger.info(req.t("auth:logs.orchestratingVerification"));
    const verificationToken = await createVerificationToken(newUser);

    // Add a job to the queue to send the verification email asynchronously.
    await addEmailJob(EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: verificationToken,
      locale: req.locale, // Pass user's locale for i18n in the worker
    });

    // Set rate limit after successful token creation and job queuing.
    await redisClient.set(
      rateLimitKey,
      "true",
      "EX",
      RATE_LIMIT_DURATIONS.VERIFY_EMAIL
    );
  } catch (emailOrTokenError) {
    // This is a "soft failure". We log the error for observability but do not fail the
    // entire registration process, as the user has been successfully created.
    // The user can use the "resend verification" feature to recover.
    const errorContext = {
      err: emailOrTokenError,
      errorName: emailOrTokenError.name,
      userId: newUser.id,
    };
    authServiceLogger.error(
      errorContext,
      req.t("auth:register.errors.postRegistrationTaskFailed", {
        errorName: emailOrTokenError.name,
      })
    );
  }

  // Return a plain object representation of the user.
  return newUser.toJSON();
};

/**
 * Verifies a user's email using a token.
 *
 * @param {string} token - The verification token from the URL.
 * @throws {NotFoundError} If the token is invalid or expired.
 * @returns {Promise<{status: (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS]}>} An object containing the verification status.
 */
export const verifyUserEmail = async (token) => {
  // 1. Hash the incoming token to match the one stored in Redis.
  const hashedToken = crypto
    .createHash(HASHING_ALGORITHM)
    .update(token)
    .digest("hex");
  const verifyKey = `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`;

  // 2. Check if the token exists in Redis
  const userDataJSON = await redisClient.get(verifyKey);
  if (!userDataJSON) {
    throw new NotFoundError("auth:verify.invalidToken");
  }

  const userData = JSON.parse(userDataJSON);

  // 3. Find the user in the database.
  const user = await User.findById(userData.userId);
  if (!user) {
    // This is an edge case, but good to handle.
    // It means the token was valid, but the user was deleted.
    throw new NotFoundError("auth:verify.userNotFound");
  }

  // 4. (Idempotency Check) If user is already verified, we can stop here.
  if (user.isVerified) {
    // Optionally, still delete the token so it can't be used again.
    await redisClient.del(verifyKey);
    return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
  }

  // 5. Update the user's verification status.
  user.isVerified = true;
  await user.save();

  // 6. Delete the token from Redis so it cannot be used again.
  await redisClient.del(verifyKey);

  authServiceLogger.info(
    { userId: user.id },
    systemT("auth:logs.verifySuccess")
  );
  return { status: VERIFICATION_STATUS.VERIFIED };
};
