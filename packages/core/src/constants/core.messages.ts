/**
 * Core Package Message Constants
 *
 * Centralized dev-facing messages for the core package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 *
 * Organized by feature:
 * - Registration messages
 * - Verification messages
 * - Token messages
 */

// ============================================================================
// REGISTRATION MESSAGES
// ============================================================================

export const REGISTRATION_MESSAGES = {
  // Success/Info
  ORCHESTRATING_VERIFICATION: "Orchestrating email verification for user",
  USER_CREATED: "User created successfully",
  VERIFICATION_EMAIL_QUEUED: "Verification email queued successfully",

  // Warnings
  DUPLICATE_KEY_DETECTED: "Duplicate key error detected during registration",

  // Errors
  CREATE_TOKEN_FAILED: "Failed to create verification token",
  ADD_EMAIL_JOB_FAILED: "Failed to add email job to queue",
  SET_RATE_LIMIT_FAILED: "Failed to set rate limit in Redis",
  MONGOOSE_VALIDATION_TRIGGERED:
    "CRITICAL: Mongoose validation triggered! Zod schema may be incomplete.",
};

export const REGISTRATION_ERRORS = {
  TOKEN_CREATION_FAILED: "Token creation failed",
  EMAIL_JOB_FAILED: "Failed to queue verification email",
  RATE_LIMIT_FAILED: "Failed to set rate limit",
  REGISTRATION_FAILED: "User registration failed",
};

// ============================================================================
// VERIFICATION MESSAGES
// ============================================================================

export const VERIFICATION_MESSAGES = {
  // Debug
  REDIS_KEY_CONSTRUCTED: "Redis verification key constructed",
  TOKEN_FOUND_REDIS: "Verification token found in Redis",

  // Info
  USER_ALREADY_VERIFIED: "User is already verified",
  VERIFY_SUCCESS: "User verified successfully",

  // Warnings
  TOKEN_NOT_FOUND_REDIS: "Verification token not found in Redis",

  // Errors
  PARSE_REDIS_DATA_FAILED: "Failed to parse Redis data",
  USER_FROM_TOKEN_NOT_FOUND: "User from token not found in database",
};

export const VERIFICATION_ERRORS = {
  INVALID_TOKEN: "Invalid or expired verification token",
  USER_NOT_FOUND: "User not found",
  INVALID_DATA_FORMAT: "Invalid data format in Redis",
};

// ============================================================================
// TOKEN MESSAGES
// ============================================================================

export const TOKEN_MESSAGES = {
  CREATING_TOKEN: "Creating verification token",
  TOKEN_STORED_REDIS: "Token stored in Redis",
  TOKEN_CREATION_FAILED: "Token creation failed",
};

export const TOKEN_ERRORS = {
  CREATION_FAILED: "Failed to create token",
  STORAGE_FAILED: "Failed to store token in Redis",
};
