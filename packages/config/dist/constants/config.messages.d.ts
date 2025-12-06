/**
 * Config Package Message Constants
 *
 * Centralized messages for dev-facing logs and errors in the config package.
 * These are infrastructure messages and should be in plain English for grep-ability.
 */
export declare const CONFIG_MESSAGES: {
    REDIS_CONNECTED: string;
    REDIS_READY: string;
    REDIS_DISCONNECTED: string;
    REDIS_CONNECTION_ERROR: string;
    REDIS_INIT_FAILED: string;
    REDIS_CB_OPENED: string;
    REDIS_CB_HALF_OPEN: string;
    REDIS_CB_CLOSED: string;
    REDIS_CB_COMMAND_FAILED: string;
    REDIS_CB_COMMAND_TIMEOUT: string;
    REDIS_CB_COMMAND_REJECTED: string;
    REDIS_CB_OPERATION_FAILED: string;
    REDIS_CB_GRACEFUL_DEGRADATION: string;
    SENTRY_INITIALIZED: string;
    SENTRY_INIT_FAILED: string;
    DATABASE_SERVICE_CREATED: string;
    EMAIL_SERVICE_CREATED: string;
    FF_ENABLED: string;
    FF_DISABLED: string;
    FF_ENABLED_FOR_USER: string;
    FF_ROLLOUT_SET: string;
    I18N_NO_LOCALES: string;
    I18N_DISCOVERY_FAILED: string;
    SERVICE_INITIALIZED: string;
};
export declare const CONFIG_ERRORS: {
    MISSING_CONFIG: string;
    MISSING_LOGGER: string;
    REDIS_URL_REQUIRED: string;
    REDIS_INIT_FAILED: string;
    DATABASE_CONFIG_REQUIRED: string;
    DATABASE_LOGGER_REQUIRED: string;
    FF_REDIS_REQUIRED: string;
    FF_LOGGER_REQUIRED: string;
    FF_CHECK_ERROR: string;
    FF_ENABLE_FAILED: string;
    FF_DISABLE_FAILED: string;
    FF_ENABLE_USER_FAILED: string;
    FF_ROLLOUT_FAILED: string;
    FF_GET_ALL_FAILED: string;
    FF_PERCENTAGE_INVALID: string;
    INVALID_CONFIGURATION: string;
};
//# sourceMappingURL=config.messages.d.ts.map