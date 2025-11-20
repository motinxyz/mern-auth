import { User, default as mongoose } from "@auth/database";
import crypto from "node:crypto";
import {
  logger,
  t,
  config, // Import the main config object
} from "@auth/config";
import {
  TooManyRequestsError,
  NotFoundError,
  VERIFICATION_STATUS,
  RATE_LIMIT_DURATIONS,
  HASHING_ALGORITHM,
  REDIS_RATE_LIMIT_VALUE,
  ApiError,
  HTTP_STATUS_CODES,
  createAuthRateLimitKey,
  createVerifyEmailKey,
  ServiceUnavailableError,
  ConflictError,
} from "@auth/utils";
import { createVerificationToken } from "../token/token.service.js";
import { addEmailJob } from "@auth/queues/producers";
import { redisConnection } from "@auth/config";
import { EMAIL_JOB_TYPES } from "@auth/utils";

const authServiceLogger = logger.child({ module: "auth-service" });

export const registerNewUser = async (userData, req) => {
  const { email } = userData;
  const rateLimitKey = createAuthRateLimitKey(
    config.redis.prefixes.verifyEmailRateLimit, // Access via config
    email
  );

  if (await redisConnection.get(rateLimitKey)) {
    throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
  }

  let newUser;
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    try {
      [newUser] = await User.create([userData], { session });
    } catch (dbError) {
      if (dbError.code === 11000) {
        authServiceLogger.warn(
          { dbError },
          "Attempted to register with duplicate key."
        );
        const errors = Object.keys(dbError.keyPattern).map((key) => ({
          field: key,
          issue:
            key === "email"
              ? "validation:email.inUse"
              : "validation:duplicateValue",
          value: dbError.keyValue[key],
        }));
        throw new ConflictError("auth:register.errors.duplicateKey", errors);
      }
      // Re-throw other errors (including Mongoose ValidationError) to be handled by the global error handler
      throw dbError;
      authServiceLogger.error(
        { dbError },
        "Failed to create new user in database."
      );
      throw new ApiError(
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        "auth:errors.dbCreateUserFailed"
      );
    }

    authServiceLogger.info(req.t("auth:logs.orchestratingVerification"));
    let verificationToken;
    try {
      verificationToken = await createVerificationToken(newUser);
    } catch (tokenError) {
      authServiceLogger.error(
        { tokenError },
        "Failed to create verification token."
      );
      throw new ApiError(
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        "auth:errors.createTokenFailed"
      );
    }

    try {
      await addEmailJob(EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL, {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        token: verificationToken,
        locale: req.locale,
      });
    } catch (emailJobError) {
      authServiceLogger.error(
        { emailJobError },
        "Failed to add email verification job to queue."
      );
      throw new ServiceUnavailableError("auth:errors.addEmailJobFailed");
    }
  });

  try {
    await redisConnection.set(
      rateLimitKey,
      REDIS_RATE_LIMIT_VALUE,
      "EX",
      RATE_LIMIT_DURATIONS.VERIFY_EMAIL
    );
  } catch (redisSetError) {
    authServiceLogger.error(
      { redisSetError },
      "Failed to set rate limit in Redis."
    );
    throw new ServiceUnavailableError("auth:errors.setRateLimitFailed");
  }

  return newUser.toJSON();
};
export const verifyUserEmail = async (token) => {
  const hashedToken = crypto
    .createHash(HASHING_ALGORITHM)
    .update(token)
    .digest("hex");
  const verifyKey = createVerifyEmailKey(
    config.redis.prefixes.verifyEmail, // Access via config
    hashedToken
  );

  authServiceLogger.debug(
    { key: verifyKey },
    t("auth:logs.redisKeyConstructed")
  );

  const userDataJSON = await redisConnection.get(verifyKey);
  if (!userDataJSON) {
    authServiceLogger.warn(
      { key: verifyKey },
      t("auth:logs.tokenNotFoundRedis")
    );
    throw new NotFoundError("auth:verify.invalidToken");
  }

  authServiceLogger.debug(
    { key: verifyKey, data: userDataJSON },
    t("auth:logs.tokenFoundRedis")
  );

  let userData;
  try {
    userData = JSON.parse(userDataJSON);
  } catch (error) {
    authServiceLogger.error(
      { error, redisData: userDataJSON },
      "Failed to parse user data from Redis."
    );
    throw new ApiError(
      HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      t("auth:errors.invalidDataFormat")
    );
  }

  const user = await User.findById(userData.userId);
  if (!user) {
    authServiceLogger.error(
      { userId: userData.userId },
      t("auth:logs.userFromTokenNotFound")
    );
    throw new NotFoundError("auth:verify.userNotFound");
  }

  if (user.isVerified) {
    await redisConnection.del(verifyKey);
    authServiceLogger.info(
      { userId: user.id },
      t("auth:logs.userAlreadyVerified")
    );
    return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
  }

  user.isVerified = true;
  await user.save();

  await redisConnection.del(verifyKey);

  authServiceLogger.info({ userId: user.id }, t("auth:logs.verifySuccess"));
  return { status: VERIFICATION_STATUS.VERIFIED };
};

