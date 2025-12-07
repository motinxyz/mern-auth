/**
 * Custom error class for when a BullMQ worker receives a job with an unrecognized type.
 */
export default class UnknownJobTypeError extends Error {
    readonly jobType: string;
    constructor(message: string, jobType: string);
}
//# sourceMappingURL=UnknownJobTypeError.d.ts.map