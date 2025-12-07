/**
 * Data Transfer Object for email verification
 * Framework-agnostic - no Express dependencies
 */
export declare class VerificationDto {
    token: string;
    constructor({ token }: {
        token: string;
    });
    /**
     * Create DTO from Express request
     * @param {object} query - Request query parameters
     * @returns {VerificationDto}
     */
    static fromRequest(query: Record<string, string>): VerificationDto;
}
//# sourceMappingURL=verification.dto.d.ts.map