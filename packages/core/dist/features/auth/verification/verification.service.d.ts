import type { Model } from "mongoose";
import type { IConfig, ILogger, ICacheService } from "@auth/contracts";
import type { UserDocument } from "@auth/database";
/**
 * Service responsible ONLY for email verification logic
 * Single Responsibility: Handle email verification process
 */
export declare class VerificationService {
    User: Model<UserDocument>;
    redis: ICacheService;
    config: IConfig;
    logger: ILogger;
    constructor({ userModel, redis, config, logger }: {
        userModel: Model<UserDocument>;
        redis: ICacheService;
        config: IConfig;
        logger: ILogger;
    });
    verify(token: string): Promise<{
        status: "ALREADY_VERIFIED";
    } | {
        status: "VERIFIED";
    }>;
}
//# sourceMappingURL=verification.service.d.ts.map