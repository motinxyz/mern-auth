/**
 * Custom error for when a BullMQ job's data payload is invalid or missing required fields.
 * This helps distinguish data validation issues from other processing errors.
 */
export default class InvalidJobDataError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "InvalidJobDataError";
    this.issues = issues; // Array of specific validation problems, e.g., [{ field: 'user', message: 'is required' }]
  }
}