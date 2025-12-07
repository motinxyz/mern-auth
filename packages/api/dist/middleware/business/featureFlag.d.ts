/**
 * Feature Flag Middleware
 * Checks if a feature is enabled before allowing access to a route
 */
import type { Request, Response, NextFunction } from "express";
interface FeatureFlagService {
    isEnabled: (flagName: string, userId: string | null) => Promise<boolean>;
}
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}
export declare const featureFlagMiddleware: (featureFlagService: FeatureFlagService, flagName: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=featureFlag.d.ts.map