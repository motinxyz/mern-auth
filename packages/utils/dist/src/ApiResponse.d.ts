/**
 * @class ApiResponse
 * @description A standardized class for API success responses.
 */
export default class ApiResponse<T = unknown> {
    readonly success: boolean;
    readonly statusCode: number;
    readonly message: string;
    readonly data: T;
    constructor(statusCode: number, data: T, message?: string);
}
//# sourceMappingURL=ApiResponse.d.ts.map