export const featureFlagMiddleware = (featureFlagService, flagName) => {
    return async (req, res, next) => {
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
            return next();
        }
        catch (_error) {
            // If feature flag check fails, allow access (fail open)
            return next();
        }
    };
};
//# sourceMappingURL=featureFlag.js.map