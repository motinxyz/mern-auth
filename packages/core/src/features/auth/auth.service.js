import { User, default as mongoose } from "@auth/database";
import crypto from "node:crypto";
import { logger, t } from "@auth/config";
import { AUTH_REDIS_PREFIXES, TOKEN_REDIS_PREFIXES } from "@auth/config";
import {
  TooManyRequestsError,
  NotFoundError,
  VERIFICATION_STATUS,
  RATE_LIMIT_DURATIONS,
  HASHING_ALGORITHM, // This is used in verifyUserEmail, not registerNewUser
} from "@auth/utils";
import { createVerificationToken } from "../token/token.service.js"; // Corrected path
import { addEmailJob } from "@auth/queues/producers";
import { redisConnection } from "@auth/queues";
import { EMAIL_JOB_TYPES } from "@auth/utils";

const authServiceLogger = logger.child({ module: "auth-service" });

/**
 * Registers a new user in the system.
 * This function handles user creation within a transaction, orchestrates the email verification flow,
 * and applies a rate limit to prevent abuse.
 *
 * @param {object} userData - The data for the new user (e.g., name, email, password).
 * @param {object} req - The Express request object, used for accessing translation functions and locale.
 * @returns {Promise<object>} A promise that resolves to the newly created user object (JSON representation).
 * @throws {TooManyRequestsError} If the email address has exceeded the verification request rate limit.
 * @throws {Error} For any other unexpected errors during user creation or verification orchestration.
 */
export const registerNewUser = async (userData, req) => {
  const { email } = userData;
  const rateLimitKey = `${AUTH_REDIS_PREFIXES.VERIFY_EMAIL_RATE_LIMIT}${email}`;

  if (await redisConnection.get(rateLimitKey)) {
    throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
  }

  let newUser;
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    // Create the user within the transaction
    [newUser] = await User.create([userData], { session });

    // Orchestrate the verification flow
    authServiceLogger.info(req.t("auth:logs.orchestratingVerification"));
    const verificationToken = await createVerificationToken(newUser);

    // Add a job to the queue to send the verification email
    await addEmailJob(
      EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        token: verificationToken,
        locale: req.locale,
      }
    );
  });

  // Set rate limit only after the transaction is successful
  await redisConnection.set(
    rateLimitKey,
    "true",
    "EX",
    RATE_LIMIT_DURATIONS.VERIFY_EMAIL
  );

  return newUser.toJSON();
};

/**
 * Verifies a user's email address using a provided token.
 * This function hashes the token, checks its validity in Redis,
 * updates the user's verification status in the database, and deletes the token from Redis.
 *
 * @param {string} token - The verification token received by the user.
 * @returns {Promise<object>} A promise that resolves to an object containing the verification status.
 * @throws {NotFoundError} If the token is invalid, expired, or the associated user is not found.
 */
export const verifyUserEmail = async (token) => {
  // 1. Hash the incoming token to match the one stored in Redis.
  const hashedToken = crypto
    .createHash(HASHING_ALGORITHM)
    .update(token)
    .digest("hex");
  const verifyKey = `${TOKEN_REDIS_PREFIXES.VERIFY_EMAIL}${hashedToken}`;
  authServiceLogger.debug(
    { key: verifyKey },
    "Constructed Redis key for verification token."
  );

  // 2. Check if the token exists in Redis
  const userDataJSON = await redisConnection.get(verifyKey);
  if (!userDataJSON) {
    authServiceLogger.warn(
      { key: verifyKey },
      "Verification token not found in Redis."
    );
    throw new NotFoundError("auth:verify.invalidToken");
  }
  authServiceLogger.debug(
    { key: verifyKey, data: userDataJSON },
    "Found verification token in Redis."
  );

  const userData = JSON.parse(userDataJSON);

  // 3. Find the user in the database.
  const user = await User.findById(userData.userId);
  if (!user) {
    // This is an edge case, but good to handle.
    // It means the token was valid, but the user was deleted.
    authServiceLogger.error(
      { userId: userData.userId },
      "User from token not found in database."
    );
    throw new NotFoundError("auth:verify.userNotFound");
  }

  // 4. (Idempotency Check) If user is already verified, we can stop here.
  if (user.isVerified) {
    // Optionally, still delete the token so it can't be used again.
    await redisConnection.del(verifyKey);
    authServiceLogger.info({ userId: user.id }, "User is already verified.");
    return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
  }

  // 5. Update the user's verification status.
  user.isVerified = true;
  await user.save();

  // 6. Delete the token from Redis so it cannot be used again.
  await redisConnection.del(verifyKey);

  authServiceLogger.info(
    { userId: user.id },
    t("auth:logs.verifySuccess")
  );
  return { status: VERIFICATION_STATUS.VERIFIED };
};
