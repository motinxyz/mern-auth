import crypto from "node:crypto";
import { logger, t } from "@auth/config";
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
  EMAIL_JOB_TYPES,
} from "@auth/utils";

const authServiceLogger = logger.child({ module: "auth-service" });

export class AuthService {
  constructor({ userModel, redis, config, emailProducer, tokenService }) {
    this.User = userModel;
    this.redis = redis;
    this.config = config;
    this.emailProducer = emailProducer;
    this.tokenService = tokenService;
  }

  async register(registerUserDto) {
    const { email, locale } = registerUserDto;
    const rateLimitKey = createAuthRateLimitKey(
      this.config.redis.prefixes.verifyEmailRateLimit,
      email
    );

    if (await this.redis.get(rateLimitKey)) {
      throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
    }

    let newUser;
    // Access mongoose from the model if needed, or inject mongoose itself.
    // For now assuming User model has db connection.
    const session = await this.User.db.startSession();
    await session.withTransaction(async () => {
      try {
        [newUser] = await this.User.create([registerUserDto], { session });
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
        throw dbError;
      }

      authServiceLogger.info("Orchestrating verification for new user.");
      let verificationToken;
      try {
        verificationToken =
          await this.tokenService.createVerificationToken(newUser);
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
        await this.emailProducer.addEmailJob(
          EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
          {
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
            },
            token: verificationToken,
            locale: locale,
          },
          {
            // Deterministic job ID prevents duplicate emails if producer retries
            // Only one verification email job per user can exist at a time
            // Note: BullMQ doesn't allow colons in job IDs, so we use hyphens
            jobId: `verify-email-${newUser.id}`,
          }
        );
      } catch (emailJobError) {
        authServiceLogger.error(
          { emailJobError },
          "Failed to add email verification job to queue."
        );
        throw new ServiceUnavailableError("auth:errors.addEmailJobFailed");
      }
    });

    try {
      await this.redis.set(
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
  }

  async verifyUserEmail(token) {
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(token)
      .digest("hex");
    const verifyKey = createVerifyEmailKey(
      this.config.redis.prefixes.verifyEmail,
      hashedToken
    );

    authServiceLogger.debug(
      { key: verifyKey },
      t("auth:logs.redisKeyConstructed")
    );

    const userDataJSON = await this.redis.get(verifyKey);
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

    const user = await this.User.findById(userData.userId);
    if (!user) {
      authServiceLogger.error(
        { userId: userData.userId },
        t("auth:logs.userFromTokenNotFound")
      );
      throw new NotFoundError("auth:verify.userNotFound");
    }

    if (user.isVerified) {
      await this.redis.del(verifyKey);
      authServiceLogger.info(
        { userId: user.id },
        t("auth:logs.userAlreadyVerified")
      );
      return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
    }

    user.isVerified = true;
    await user.save();

    await this.redis.del(verifyKey);

    authServiceLogger.info({ userId: user.id }, t("auth:logs.verifySuccess"));
    return { status: VERIFICATION_STATUS.VERIFIED };
  }
}
