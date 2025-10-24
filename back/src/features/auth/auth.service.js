import User from "./user.model.js";
import { ConflictError } from "../../errors/index.js";

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
  const user = await User.create(userData);

  // The password will not be returned because of `select: false` in the model.
  return user;
};