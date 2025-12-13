export const CONFIG_MESSAGES = {
    FF_ENABLED: "Feature flag enabled",
    FF_DISABLED: "Feature flag disabled",
    FF_ENABLED_FOR_USER: "Feature flag enabled for user",
    FF_ROLLOUT_SET: "Feature flag rollout percentage set",
};

export const CONFIG_ERRORS = {
    FF_REDIS_REQUIRED: "Redis connection is required for FeatureFlagService",
    FF_LOGGER_REQUIRED: "Logger is required for FeatureFlagService",
    FF_CHECK_ERROR: "Error checking feature flag",
    FF_ENABLE_FAILED: "Failed to enable feature flag",
    FF_DISABLE_FAILED: "Failed to disable feature flag",
    FF_ENABLE_USER_FAILED: "Failed to enable feature flag for user",
    FF_ROLLOUT_FAILED: "Failed to set rollout percentage",
    FF_GET_ALL_FAILED: "Failed to get all flags",
    FF_PERCENTAGE_INVALID: "Percentage must be between 0 and 100",
};
