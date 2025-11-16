import { User, default as mongoose } from "@auth/database";
import crypto from "node:crypto";
import {
  logger,
  t,
  AUTH_REDIS_PREFIXES,
  TOKEN_REDIS_PREFIXES,
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
} from "@auth/utils";
import { createVerificationToken } from "../token/token.service.js";
import { addEmailJob } from "@auth/queues/producers";
import { redisConnection } from "@auth/config";
import { EMAIL_JOB_TYPES } from "@auth/utils";

const authServiceLogger = logger.child({ module: "auth-service" });

export const registerNewUser = async (userData, req) => {
  const { email } = userData;
  const rateLimitKey = createAuthRateLimitKey(
    AUTH_REDIS_PREFIXES.VERIFY_EMAIL_RATE_LIMIT,
    email
  );

  if (await redisConnection.get(rateLimitKey)) {
    throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
  }

  let newUser;
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    [newUser] = await User.create([userData], { session });

    authServiceLogger.info(req.t("auth:logs.orchestratingVerification"));
    const verificationToken = await createVerificationToken(newUser);

    await addEmailJob(EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: verificationToken,
      locale: req.locale,
    });
  });

  await redisConnection.set(
    rateLimitKey,
    REDIS_RATE_LIMIT_VALUE,
    "EX",
    RATE_LIMIT_DURATIONS.VERIFY_EMAIL
  );

  return newUser.toJSON();
};

export const verifyUserEmail = async (token) => {
  const hashedToken = crypto
    .createHash(HASHING_ALGORITHM)
    .update(token)
    .digest("hex");
  const verifyKey = createVerifyEmailKey(
    TOKEN_REDIS_PREFIXES.VERIFY_EMAIL,
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
