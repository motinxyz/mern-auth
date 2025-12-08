import * as Sentry from "@sentry/node";
import {
  normalizeEmail,
  ConflictError,
  TooManyRequestsError,
  createAuthRateLimitKey,
  ServiceUnavailableError,
  HttpError,
  HTTP_STATUS_CODES,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
  getTraceContext,
} from "@auth/utils";
import type {
  ILogger,
  IConfig,
  ICacheService,
  IQueueProducer,
  ITokenService,
} from "@auth/contracts";
import type { Model } from "mongoose";
import type { UserDocument } from "@auth/database";
import {
  RATE_LIMIT_DURATIONS,
  REDIS_RATE_LIMIT_VALUE,
} from "../../../constants/auth.constants.js";
import { EMAIL_JOB_TYPES } from "@auth/config";
import {
  REGISTRATION_MESSAGES,
} from "../../../constants/core.messages.js";

import { RegistrationDto } from "./registration.dto.js";

// Define Mongoose error shape
interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  name: string;
}

/**
 * RegistrationService
 *
 * Handles ONLY user registration logic.
 * Dependencies injected via constructor for testability.
 */
export class RegistrationService {
  private readonly User: Model<UserDocument>;
  private readonly redis: ICacheService;
  private readonly config: IConfig;
  private readonly emailProducer: IQueueProducer;
  private readonly tokenService: ITokenService;
  private readonly sentry: typeof Sentry | undefined;
  private readonly logger: ILogger;

  constructor({
    userModel,
    redis,
    config,
    emailProducer,
    tokenService,
    sentry,
    logger,
  }: {
    userModel: Model<UserDocument>;
    redis: ICacheService;
    config: IConfig;
    emailProducer: IQueueProducer;
    tokenService: ITokenService;
    sentry?: typeof Sentry;
    logger: ILogger;
  }) {
    this.User = userModel;
    this.redis = redis;
    this.config = config;
    this.emailProducer = emailProducer;
    this.tokenService = tokenService;
    this.sentry = sentry;
    this.logger = logger.child({ module: "registration-service" });
  }

  async register(registerUserDto: RegistrationDto) {
    const { email, locale } = registerUserDto;

    return withSpan(
      "registration-service.register-user",
      async () => {
        // Add root span attributes
        addSpanAttributes({
          "service.module": "registration-service",
          "user.email_hash": hashSensitiveData(email),
          "user.locale": locale,
        });

        // Normalize email to prevent duplicate accounts (e.g. dot-variants)
        const normalizedEmail = normalizeEmail(email);

        const rateLimitKey = createAuthRateLimitKey(
          this.config.redis.prefixes.verifyEmailRateLimit,
          normalizedEmail
        );

        // Check rate limit
        await withSpan(
          "registration-service.check-rate-limit",
          async () => {
            addSpanAttributes({
              "rate_limit.key_prefix":
                this.config.redis.prefixes.verifyEmailRateLimit,
              "user.email_hash": hashSensitiveData(normalizedEmail),
            });

            const isRateLimited = await this.redis.get(rateLimitKey);

            addSpanAttributes({
              "rate_limit.is_limited": isRateLimited !== null,
            });

            if (isRateLimited !== null) {
              throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
            }
          }
        );

        let newUser!: UserDocument;
        const session = await this.User.db.startSession();

        await withSpan(
          "registration-service.db-transaction",
          async () => {
            addSpanAttributes({
              "db.system": "mongodb",
              "db.operation": "transaction",
            });

            await session.withTransaction(async () => {
              try {
                // Create user in database
                await withSpan(
                  "registration-service.create-user",
                  async () => {
                    addSpanAttributes({
                      "db.operation": "insert",
                      "db.mongodb.collection": "users",
                      "user.email_hash": hashSensitiveData(email),
                    });

                    const userData = {
                      name: registerUserDto.name,
                      email: registerUserDto.email,
                      normalizedEmail: normalizedEmail,
                      password: registerUserDto.password,
                    };

                    const result = await this.User.create([userData], { session });
                    const createdUser = result[0];
                    if (!createdUser) {
                      throw new Error("Failed to create user document");
                    }
                    newUser = createdUser;

                    addSpanAttributes({
                      "user.id": newUser._id.toString(),
                    });
                  }
                );
              } catch (error) {
                const dbError = error as MongoError;

                // DEFENSE IN DEPTH: Handle Mongoose validation errors
                if (dbError.name === "ValidationError") {
                  this.logger.error(
                    {
                      dbError,
                      userData: { ...registerUserDto, password: "[REDACTED]" },
                      alert: "MONGOOSE_VALIDATION_TRIGGERED",
                    },
                    REGISTRATION_MESSAGES.MONGOOSE_VALIDATION_TRIGGERED
                  );

                  // Alert via Sentry if available
                  if (this.sentry) {
                    this.sentry.captureException(dbError, {
                      tags: {
                        alert: "defense_in_depth_triggered",
                        layer: "database",
                        type: "mongoose_validation_error",
                      },
                      extra: {
                        userData: {
                          ...registerUserDto,
                          password: "[REDACTED]",
                        }, // Redact sensitive data
                      },
                      level: "fatal",
                    });
                  }

                  throw new HttpError(
                    HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
                    "auth:errors.registrationFailed"
                  );
                }

                if (dbError.code === 11000 && dbError.keyPattern) {
                  this.logger.warn(
                    { dbError, email, normalizedEmail },
                    REGISTRATION_MESSAGES.DUPLICATE_KEY_DETECTED
                  );
                  const errors = Object.keys(dbError.keyPattern).map((key) => ({
                    field: key === "normalizedEmail" ? "email" : key,
                    message:
                      key === "email" || key === "normalizedEmail"
                        ? "validation:email.inUse"
                        : "validation:duplicateValue",
                  }));
                  throw new ConflictError(
                    "auth:logs.registerDuplicateKey",
                    errors
                  );
                }
                throw dbError;
              }
            });
          }
        );

        // Generate verification token
        await withSpan("registration-service.generate-token", async () => {
          this.logger.info(
            { userId: newUser._id },
            REGISTRATION_MESSAGES.ORCHESTRATING_VERIFICATION
          );

          let verificationToken;
          try {
            verificationToken =
              await this.tokenService.createVerificationToken({
                ...newUser.toObject(),
                _id: newUser._id.toString(),
              });
          } catch (tokenError) {
            this.logger.error(
              { tokenError, userId: newUser._id },
              REGISTRATION_MESSAGES.CREATE_TOKEN_FAILED
            );
            throw new HttpError(
              HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
              "auth:errors.createTokenFailed"
            );
          }

          // Queue verification email
          await withSpan("registration-service.queue-email", async () => {
            try {
              const traceContext = getTraceContext(); // Get current trace context

              await this.emailProducer.addJob(
                EMAIL_JOB_TYPES.SEND_VERIFICATION_EMAIL,
                {
                  user: {
                    id: newUser._id.toString(),
                    name: newUser.name,
                    email: newUser.email,
                  },
                  token: verificationToken,
                  locale: locale,
                  traceContext, // Propagate trace context to worker
                },
                {
                  jobId: `verify-email-${newUser._id}`,
                }
              );
            } catch (emailJobError) {
              this.logger.error(
                { emailJobError, userId: newUser._id },
                REGISTRATION_MESSAGES.ADD_EMAIL_JOB_FAILED
              );
              throw new ServiceUnavailableError(
                "auth:errors.addEmailJobFailed"
              );
            }
          });
        });

        // Set rate limit (simple Redis operation, no dedicated span needed)
        try {
          await this.redis.set(
            rateLimitKey,
            REDIS_RATE_LIMIT_VALUE,
            "EX",
            RATE_LIMIT_DURATIONS.VERIFY_EMAIL
          );
        } catch (redisSetError) {
          this.logger.error(
            { redisSetError, email },
            REGISTRATION_MESSAGES.SET_RATE_LIMIT_FAILED
          );
          throw new ServiceUnavailableError("auth:errors.setRateLimitFailed");
        }

        return newUser.toJSON();
      },
      { tracerName: "auth-api", component: "api" }
    );
  }
}
