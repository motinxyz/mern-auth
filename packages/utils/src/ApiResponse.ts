/**
 * @class ApiResponse
 * @description A standardized class for API success responses.
 */
export default class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;

  constructor(statusCode: number, data: T, message: string = "success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
