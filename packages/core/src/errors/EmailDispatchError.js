/**
 * Custom error for failures that occur while dispatching an email.
 * This wraps the original error from the email transport (e.g., nodemailer)
 * to provide more specific context in logs and error handling.
 */
export default class EmailDispatchError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = "EmailDispatchError";
    this.originalError = originalError; // The underlying error from the mailer
  }
}