/**
 * Feature Flag Middleware
 * Checks if a feature is enabled before allowing access to a route
 */
import type { Request, Response, NextFunction } from "express";

interface FeatureFlagService {
  isEnabled: (flagName: string, userId: string | null) => Promise<boolean>;
}

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const featureFlagMiddleware = (featureFlagService: FeatureFlagService, flagName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id ?? null;
      const isEnabled = await featureFlagService.isEnabled(flagName, userId);

      if (!isEnabled) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: "Feature not available",
        });
      }

      next();
    } catch (_error) {
      // If feature flag check fails, allow access (fail open)
      next();
    }
  };
};
