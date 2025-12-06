import { User } from "@auth/database";
import {
  normalizeEmail,
  ConflictError,
  TooManyRequestsError,
  createAuthRateLimitKey,
  ServiceUnavailableError,
  ApiError,
  HTTP_STATUS_CODES,
  withSpan,
  addSpanAttributes,
  hashSensitiveData,
  getTraceContext,
} from "@auth/utils";
import {
  RATE_LIMIT_DURATIONS,
  REDIS_RATE_LIMIT_VALUE,
} from "../../../constants/auth.constants.js";
import { EMAIL_JOB_TYPES } from "@auth/config";
import {
  REGISTRATION_MESSAGES,
  REGISTRATION_ERRORS,
} from "../../../constants/core.messages.js";

/**
 * RegistrationService
 *
 * Handles ONLY user registration logic.
 * Dependencies injected via constructor for testability.
 */
export class RegistrationService {
  /**
   * @param {Object} deps - Dependencies
   * @param {import("mongoose").Model} deps.userModel - Mongoose User model
   * @param {import("@auth/contracts").ICacheService} deps.redis - Cache service (Redis)
   * @param {Object} deps.config - Application configuration
   * @param {import("@auth/contracts").IQueueProducer} deps.emailProducer - Email queue producer
   * @param {import("@auth/contracts").ITokenService} deps.tokenService - Token service
   * @param {Object} deps.sentry - Sentry error tracking
   * @param {Object} deps.logger - Pino logger
   */
  User: any;
  redis: any;
  config: any;
  emailProducer: any;
  tokenService: any;
  sentry: any;
  logger: any;

  constructor({
    userModel,
    redis,
    config,
    emailProducer,
    tokenService,
    sentry,
    logger,
  }: any) {
    this.User = userModel;
    this.redis = redis;
    this.config = config;
    this.emailProducer = emailProducer;
    this.tokenService = tokenService;
    this.sentry = sentry;
    this.logger = logger.child({ module: "registration-service" });
  }

  async register(registerUserDto) {
    const { email, locale } = registerUserDto;

    return withSpan(
      "registration-service.register-user",
      async (rootSpan) => {
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
          async (span) => {
            addSpanAttributes({
              "rate_limit.key_prefix":
                this.config.redis.prefixes.verifyEmailRateLimit,
              "user.email_hash": hashSensitiveData(normalizedEmail),
            });

            const isRateLimited = await this.redis.get(rateLimitKey);

            addSpanAttributes({
              "rate_limit.is_limited": !!isRateLimited,
            });

            if (isRateLimited) {
              throw new TooManyRequestsError(RATE_LIMIT_DURATIONS.VERIFY_EMAIL);
            }
          }
        );

        let newUser;
        const session = await this.User.db.startSession();

        await withSpan(
          "registration-service.db-transaction",
          async (txSpan) => {
            addSpanAttributes({
              "db.system": "mongodb",
              "db.operation": "transaction",
            });

            await session.withTransaction(async () => {
              try {
                // Create user in database
                await withSpan(
                  "registration-service.create-user",
                  async (createSpan) => {
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

                    [newUser] = await this.User.create([userData], { session });

                    addSpanAttributes({
                      "user.id": newUser._id.toString(),
                    });
                  }
                );
              } catch (dbError) {
                // DEFENSE IN DEPTH: Handle Mongoose validation errors
                // This should NEVER happen if Zod validation is working correctly.
                // If it does, it indicates a bug in the Zod schema or data flow.
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

                  // Return a generic error to the user to avoid exposing internal details
                  // while alerting the team via logs/monitoring
                  throw new ApiError(
                    HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
                    "auth:errors.registrationFailed"
                  );
                }

                if (dbError.code === 11000) {
                  this.logger.warn(
                    { dbError, email, normalizedEmail },
                    REGISTRATION_MESSAGES.DUPLICATE_KEY_DETECTED
                  );
                  const errors = Object.keys(dbError.keyPattern).map((key) => ({
                    field: key === "normalizedEmail" ? "email" : key,
                    issue:
                      key === "email" || key === "normalizedEmail"
                        ? "validation:email.inUse"
                        : "validation:duplicateValue",
                    value:
                      key === "normalizedEmail" ? email : dbError.keyValue[key],
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
              await this.tokenService.createVerificationToken(newUser);
          } catch (tokenError) {
            this.logger.error(
              { tokenError, userId: newUser._id },
              REGISTRATION_MESSAGES.CREATE_TOKEN_FAILED
            );
            throw new ApiError(
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
