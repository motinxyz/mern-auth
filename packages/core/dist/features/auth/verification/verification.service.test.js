import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { User } from "@auth/database";
import { VerificationService } from "./verification.service.js";
import { NotFoundError } from "@auth/utils";
import { VERIFICATION_STATUS } from "@auth/core/constants/auth.constants";
import crypto from "node:crypto";
// Mock Redis and config
vi.mock("@auth/config", () => ({
    getLogger: vi.fn(() => ({
        child: vi.fn(() => ({
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        })),
    })),
    redisConnection: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
    },
    logger: {
        child: vi.fn(() => ({
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        })),
    },
    t: vi.fn((key) => key),
    config: {
        redis: {
            prefixes: {
                verifyEmail: "verify-email:",
            },
        },
    },
}));
// Mock database
vi.mock("@auth/database", async (importOriginal) => {
    const actual = await importOriginal();
    actual.User.findById = vi.fn();
    return actual;
});
describe("Verification Service", () => {
    let mockRedisConnection;
    let mockConfig;
    let verificationService;
    beforeEach(async () => {
        vi.clearAllMocks();
        const configModule = await vi.importMock("@auth/config");
        mockRedisConnection = configModule.redisConnection;
        mockConfig = configModule.config;
        const mockLogger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            fatal: vi.fn(),
            child: vi.fn(() => ({
                info: vi.fn(),
                debug: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                fatal: vi.fn(),
            })),
        };
        verificationService = new VerificationService({
            userModel: User,
            redis: mockRedisConnection,
            config: mockConfig,
            logger: mockLogger,
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe("verifyEmail", () => {
        it("should verify a user with a valid token", async () => {
            const token = "valid_token";
            const hashedToken = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");
            const userData = { userId: "123" };
            const user = { id: "123", isVerified: false, save: vi.fn() };
            mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
            mockRedisConnection.del.mockResolvedValue(1);
            User.findById.mockResolvedValue(user);
            const result = await verificationService.verify(token);
            expect(User.findById).toHaveBeenCalledWith("123");
            expect(user.isVerified).toBe(true);
            expect(user.save).toHaveBeenCalled();
            expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify-email:${hashedToken}`);
            expect(result).toEqual({ status: VERIFICATION_STATUS.VERIFIED });
        });
        it("should return ALREADY_VERIFIED if user is already verified", async () => {
            const token = "valid_token";
            const hashedToken = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");
            const userData = { userId: "123" };
            const user = { id: "123", isVerified: true };
            mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
            mockRedisConnection.del.mockResolvedValue(1);
            User.findById.mockResolvedValue(user);
            const result = await verificationService.verify(token);
            expect(mockRedisConnection.del).toHaveBeenCalledWith(`verify-email:${hashedToken}`);
            expect(result).toEqual({ status: VERIFICATION_STATUS.ALREADY_VERIFIED });
        });
        it("should throw NotFoundError for an invalid token", async () => {
            const token = "invalid_token";
            mockRedisConnection.get.mockResolvedValue(null);
            await expect(verificationService.verify(token)).rejects.toThrow(NotFoundError);
        });
        it("should throw NotFoundError if user is not found", async () => {
            const token = "valid_token";
            const userData = { userId: "123" };
            mockRedisConnection.get.mockResolvedValue(JSON.stringify(userData));
            User.findById.mockResolvedValue(null);
            await expect(verificationService.verify(token)).rejects.toThrow(NotFoundError);
        });
    });
});
//# sourceMappingURL=verification.service.test.js.map