import { redisConnection } from "@auth/config";
import type { Request, Response } from "express";
import type { IDatabaseService } from "@auth/contracts";
export declare class HealthController {
    databaseService: IDatabaseService;
    redisConnection: typeof redisConnection;
    constructor();
    /**
     * Check health of all services
     * GET /api/health
     */
    checkHealth: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
}
export declare const healthController: HealthController;
//# sourceMappingURL=health.controller.d.ts.map