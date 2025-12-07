import ApiError from "../ApiError.js";
import type { ValidationError } from "../ApiError.js";
declare class ServiceUnavailableError extends ApiError {
    constructor(message?: string, errors?: ValidationError[]);
}
export default ServiceUnavailableError;
//# sourceMappingURL=ServiceUnavailableError.d.ts.map