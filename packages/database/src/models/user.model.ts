import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "@auth/config";
import { VALIDATION_RULES } from "@auth/utils";

/**
 * Mongoose schema for the User model.
 *
 * DEFENSE IN DEPTH: This validation serves as the last line of defense.
 * Primary validation happens at the API layer (Zod), but this ensures
 * data integrity even if:
 * - A developer forgets to add Zod validation
 * - Data is inserted via scripts/migrations
 * - There's a race condition
 *
 * If Mongoose validation triggers, it indicates a bug that should be investigated.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [
        VALIDATION_RULES.NAME.MIN_LENGTH,
        `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
      ],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // unique: true, // Uniqueness is now enforced on normalizedEmail
      trim: true,
      lowercase: true,
      match: [VALIDATION_RULES.EMAIL_REGEX, "Invalid email format"],
    },
    normalizedEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
      ],
      select: false,
    },
    role: {
      type: String,
      default: "user",
      trim: true,
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailValid: {
      type: Boolean,
      default: true,
    },
    emailBounceReason: String,
    emailBouncedAt: Date,
    emailComplaint: {
      type: Boolean,
      default: false,
    },
    emailComplaintAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common query patterns
userSchema.index({ email: 1, isVerified: 1 }); // Common query: find verified users by email
userSchema.index({ createdAt: -1, role: 1 }); // Admin dashboards: recent users by role
// Note: normalizedEmail unique index is defined in schema field definition

/**
 * toJSON transform to customize the output of the user object.
 * @param {mongoose.Document} doc - The mongoose document.
 * @param {object} ret - The plain object representation.
 * @returns {void}
 */
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    (ret as any).id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Ensure the password hash is never sent, even by accident
    delete ret.password;
  },
});

/**
 * Mongoose middleware to hash the password before saving.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  // Hash the password with a salt round from config
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Method to compare a candidate password with the user's hashed password.
 * @param {string} candidatePassword - The password to compare.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * @type {mongoose.Model<IUser>}
 */
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
