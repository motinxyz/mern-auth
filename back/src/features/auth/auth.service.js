import User from "./user.model.js";
import { ConflictError, TooManyRequestsError } from "../../errors/index.js";
import redisClient from "../../startup/redisClient.js";
import { sendVerificationEmail } from "../email/email.service.js";
import { createVerificationToken } from "../token/token.service.js";
import logger from "../../config/logger.js";

const authServiceLogger = logger.child({ module: "auth-service" });
/**
 * @typedef {object} Request - Express Request object.
 * @property {function} t - The translation function.
 */

/**
 * Registers a new user.
 *
 * @param {object} userData - The user data.
 * @param {string} userData.name - The user's name.
 * @param {string} userData.email - The user's email address.
 * @param {string} userData.password - The user's password.
 * @param {Request} req - The Express request object, used for translations.
 * @throws {ConflictError} If a user with the same email already exists.
 * @returns {Promise<mongoose.Document>} A promise that resolves to the created user document.
 */
export const registerNewUser = async (userData, req) => {
  const { email } = userData;

  // This rate limit specifically prevents spamming the "send verification email" step.
  const rateLimitKey = `verify-email-rate-limit:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    throw new TooManyRequestsError();
  }

  // Check if a user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Throw a standardized error with a translation key
    throw new ConflictError("validation:emailInUse", [
      {
        field: "email",
        message: "validation:emailInUse",
        value: email,
      },
    ]);
  }

  // Create the user in the database
  const newUser = await User.create(userData);

  try {
    // Orchestrate the verification flow by calling the appropriate services.
    authServiceLogger.info("Creating verification token and sending email.");
    const verificationToken = await createVerificationToken(newUser);

    // Send email and set the rate limit key in parallel.
    await Promise.all([
      sendVerificationEmail({
        user: newUser,
        token: verificationToken,
        t: req.t,
      }),
      redisClient.set(rateLimitKey, "true", { EX: 180 }), // Set rate limit after successful token creation
    ]);
  } catch (emailOrTokenError) {
    authServiceLogger.error(
      { err: emailOrTokenError },
      "Failed to send verification email or set rate limit. The user was created, but will need to request a new verification email."
    );
    // Even if the email fails, we don't want to fail the entire registration.
  }

  // Return a plain object representation of the user.
  return newUser.toJSON();
};
