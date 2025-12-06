import ApiError from "../ApiError.js";
declare class TooManyRequestsError extends ApiError {
    readonly retryAfter: number;
    constructor(retryAfter?: number);
}
export default TooManyRequestsError;
//# sourceMappingURL=TooManyRequestsError.d.ts.map