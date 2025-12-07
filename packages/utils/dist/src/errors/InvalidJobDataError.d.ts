export interface JobIssue {
    field: string;
    message: string;
}
/**
 * Custom error for when a BullMQ job's data payload is invalid or missing required fields.
 */
export default class InvalidJobDataError extends Error {
    readonly issues: JobIssue[];
    constructor(message: string, issues?: JobIssue[]);
}
//# sourceMappingURL=InvalidJobDataError.d.ts.map