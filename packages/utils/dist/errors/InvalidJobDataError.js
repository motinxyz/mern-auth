/**
 * Custom error for when a BullMQ job's data payload is invalid or missing required fields.
 */
export default class InvalidJobDataError extends Error {
    issues;
    constructor(message, issues = []) {
        super(message);
        this.name = "InvalidJobDataError";
        this.issues = issues;
    }
}
//# sourceMappingURL=InvalidJobDataError.js.map