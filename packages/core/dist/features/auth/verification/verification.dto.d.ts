/**
 * Data Transfer Object for email verification
 * Framework-agnostic - no Express dependencies
 */
export declare class VerificationDto {
    token: string;
    constructor({ token }: any);
    /**
     * Create DTO from Express request
     * @param {object} query - Request query parameters
     * @returns {VerificationDto}
     */
    static fromRequest(query: any): VerificationDto;
}
//# sourceMappingURL=verification.dto.d.ts.map