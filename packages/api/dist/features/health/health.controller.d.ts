export declare class HealthController {
    databaseService: any;
    redisConnection: any;
    constructor();
    /**
     * Check health of all services
     * GET /api/health
     */
    checkHealth: (req: any, res: any) => Promise<any>;
}
export declare const healthController: HealthController;
//# sourceMappingURL=health.controller.d.ts.map