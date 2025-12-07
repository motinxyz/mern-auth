/**
 * @class ApiResponse
 * @description A standardized class for API success responses.
 */
export default class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode, data, message = "success") {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
//# sourceMappingURL=ApiResponse.js.map