/**
 * @class ApiResponse
 * @description A standardized class for API success responses.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - The HTTP status code for the response.
   * @param {object} data - The data payload to be included in the response.
   * @param {string} message - A descriptive message for the response, typically a translation key.
   */
  constructor(statusCode, data, message = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
