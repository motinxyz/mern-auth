/**
 * Custom error class for when a BullMQ worker receives a job with an unrecognized type.
 */
export default class UnknownJobTypeError extends Error {
    jobType;
    constructor(message, jobType) {
        super(message);
        this.name = "UnknownJobTypeError";
        this.jobType = jobType;
    }
}
//# sourceMappingURL=UnknownJobTypeError.js.map