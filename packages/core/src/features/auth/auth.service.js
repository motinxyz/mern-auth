import { User, default as mongoose } from "@auth/database";
import crypto from "node:crypto";
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
  EMAIL_JOB_TYPES,
} from "@auth/utils";
import { TokenService } from "../token/token.service.js";
import { addEmailJob } from "@auth/queues/producers";
import { AUTH_REDIS_PREFIXES, TOKEN_REDIS_PREFIXES } from "@auth/config";

export class AuthService {
  constructor({ logger, redisConnection, t, tokenService }) {
    this.logger = logger.child({ module: "auth-service" });
    this.redisConnection = redisConnection;
    this.t = t;
    this.tokenService = tokenService;
  }

  async registerNewUser(userData, locale) {
    const { email } = userData;
    const rateLimitKey = createAuthRateLimitKey(
      AUTH_REDIS_PREFIXES.VERIFY_EMAIL_RATE_LIMIT,
      email
    );

    if (await this.redisConnection.get(rateLimitKey)) {
      throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
    }

    let newUser;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      [newUser] = await User.create([userData], { session });

      this.logger.info(this.t("auth:logs.orchestratingVerification"));
      const verificationToken = await this.tokenService.createVerificationToken(newUser);

      await addEmailJob(EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL, {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        token: verificationToken,
        locale,
      });
    });

    await this.redisConnection.set(
      rateLimitKey,
      REDIS_RATE_LIMIT_VALUE,
      "EX",
      RATE_LIMIT_DURATIONS.VERIFY_EMAIL
    );

    return newUser.toJSON();
  }

  async verifyUserEmail(token) {
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(token)
      .digest("hex");
    const verifyKey = createVerifyEmailKey(
      TOKEN_REDIS_PREFIXES.VERIFY_EMAIL,
      hashedToken
    );

    this.logger.debug(
      { key: verifyKey },
      this.t("auth:logs.redisKeyConstructed")
    );

    const userDataJSON = await this.redisConnection.get(verifyKey);
    if (!userDataJSON) {
      this.logger.warn(
        { key: verifyKey },
        this.t("auth:logs.tokenNotFoundRedis")
      );
      throw new NotFoundError("auth:verify.invalidToken");
    }

    this.logger.debug(
      { key: verifyKey, data: userDataJSON },
      this.t("auth:logs.tokenFoundRedis")
    );

    let userData;
    try {
      userData = JSON.parse(userDataJSON);
    } catch (error) {
      this.logger.error(
        { error, redisData: userDataJSON },
        "Failed to parse user data from Redis."
      );
      throw new ApiError(
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        this.t("auth:errors.invalidDataFormat")
      );
    }

    const user = await User.findById(userData.userId);
    if (!user) {
      this.logger.error(
        { userId: userData.userId },
        this.t("auth:logs.userFromTokenNotFound")
      );
      throw new NotFoundError("auth:verify.userNotFound");
    }

    if (user.isVerified) {
      await this.redisConnection.del(verifyKey);
      this.logger.info(
        { userId: user.id },
        this.t("auth:logs.userAlreadyVerified")
      );
      return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
    }

    user.isVerified = true;
    await user.save();

    await this.redisConnection.del(verifyKey);

    this.logger.info({ userId: user.id }, this.t("auth:logs.verifySuccess"));
    return { status: VERIFICATION_STATUS.VERIFIED };
  }
}
