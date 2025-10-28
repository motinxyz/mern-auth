import mongoose from "mongoose";
import { VALIDATION_RULES } from "../../constants/validation.constants.js";
import bcrypt from "bcrypt";

/**
 * Mongoose schema for the User model.
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "validation.required.name"],
      minlength: [VALIDATION_RULES.NAME.MIN_LENGTH, "validation.length.name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "validation.required.email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "validation.invalid.email"],
    },
    password: {
      type: String,
      required: [true, "validation.required.password"],
      minlength: [
        VALIDATION_RULES.PASSWORD.MIN_LENGTH,
        "validation.length.password",
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
  },
  {
    timestamps: true,
  }
);

/**
 * toJSON transform to customize the output of the user object.
 * @param {mongoose.Document} doc - The mongoose document.
 * @param {object} ret - The plain object representation.
 * @returns {void}
 */
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
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
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  // Hash the password with a salt round of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Method to compare a candidate password with the user's hashed password.
 * @param {string} candidatePassword - The password to compare.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
