/**
 * Custom error class for when a BullMQ worker receives a job with an unrecognized type.
 */
export default class UnknownJobTypeError extends Error {
  public readonly jobType: string;

  constructor(message: string, jobType: string) {
    super(message);
    this.name = "UnknownJobTypeError";
    this.jobType = jobType;
  }
}
