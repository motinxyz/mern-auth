import crypto from "node:crypto";
import {
  NotFoundError,
  ApiError,
  HTTP_STATUS_CODES,
  createVerifyEmailKey,
} from "@auth/utils";
import type { Model } from "mongoose";
import type { IConfig, ILogger, ICacheService } from "@auth/contracts";
import type { UserDocument } from "@auth/database";
import { HASHING_ALGORITHM } from "../../../constants/token.constants.js";
import { VERIFICATION_STATUS } from "../../../constants/auth.constants.js";
import { VERIFICATION_MESSAGES } from "../../../constants/core.messages.js";


/**
 * Service responsible ONLY for email verification logic
 * Single Responsibility: Handle email verification process
 */
export class VerificationService {
  User: Model<UserDocument>;
  redis: ICacheService;
  config: IConfig;
  logger: ILogger;

  constructor({ userModel, redis, config, logger }: { userModel: Model<UserDocument>; redis: ICacheService; config: IConfig; logger: ILogger }) {
    this.User = userModel;
    this.redis = redis;
    this.config = config;
    this.logger = logger.child({ module: "verification-service" });
  }

  async verify(token: string) {
    const hashedToken = crypto
      .createHash(HASHING_ALGORITHM)
      .update(token)
      .digest("hex");

    const verifyKey = createVerifyEmailKey(
      this.config.redis.prefixes.verifyEmail,
      hashedToken
    );

    this.logger.debug(
      { key: verifyKey },
      VERIFICATION_MESSAGES.REDIS_KEY_CONSTRUCTED
    );

    // Get token data from Redis
    const userDataJSON = await this.redis.get(verifyKey);
    if (userDataJSON === null) {
      this.logger.warn(
        { key: verifyKey },
        VERIFICATION_MESSAGES.TOKEN_NOT_FOUND_REDIS
      );
      throw new NotFoundError("auth:verify.invalidToken");
    }

    this.logger.debug(
      { key: verifyKey, data: userDataJSON },
      VERIFICATION_MESSAGES.TOKEN_FOUND_REDIS
    );

    // Parse user data
    let userData;
    try {
      userData = JSON.parse(userDataJSON);
    } catch (error) {
      this.logger.error(
        { error, redisData: userDataJSON },
        VERIFICATION_MESSAGES.PARSE_REDIS_DATA_FAILED
      );
      throw new ApiError(
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        "auth:errors.invalidDataFormat"
      );
    }

    // Find user
    const user = await this.User.findById(userData.userId);
    if (!user) {
      this.logger.error(
        { userId: userData.userId },
        VERIFICATION_MESSAGES.USER_FROM_TOKEN_NOT_FOUND
      );
      throw new NotFoundError("auth:verify.userNotFound");
    }

    // Check if already verified
    if (user.isVerified) {
      await this.redis.del(verifyKey);
      this.logger.info(
        { userId: user._id },
        VERIFICATION_MESSAGES.USER_ALREADY_VERIFIED
      );
      return { status: VERIFICATION_STATUS.ALREADY_VERIFIED };
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Clean up token
    await this.redis.del(verifyKey);

    this.logger.info({ userId: user._id }, VERIFICATION_MESSAGES.VERIFY_SUCCESS);
    return { status: VERIFICATION_STATUS.VERIFIED };
  }
}
