/**
 * Email Package Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because they are dev-facing logs.
 */
export declare const EMAIL_MESSAGES: {
    SERVICE_INITIALIZED: string;
    PROVIDERS_INITIALIZED: string;
    SMTP_NOT_CONFIGURED: string;
    SMTP_CONFIGURED: string;
    SMTP_CONNECTION_VERIFIED: string;
    RESEND_INITIALIZED: string;
    RESEND_RETRYING: string;
    RESEND_SENT: string;
    CB_OPEN: string;
    CB_HALF_OPEN: string;
    CB_CLOSED: string;
    CB_SUCCESS: string;
    CB_FAILURE: string;
    CB_TIMEOUT: string;
    CB_REJECT: string;
    ATTEMPTING_SEND: string;
    SEND_SUCCESS: string;
    PREPARING_VERIFICATION: string;
    SENDING_VERIFICATION: string;
    PROVIDER_ATTEMPT: string;
    PROVIDER_SUCCESS: string;
    PROVIDER_FAILOVER: string;
    TEMPLATES_INITIALIZED: string;
    BOUNCE_LOG_NOT_FOUND: string;
    BOUNCE_HARD_RETRY_SMTP: string;
    BOUNCE_USER_MARKED_INVALID: string;
    BOUNCE_SOFT_RECORDED: string;
    BOUNCE_SPAM_COMPLAINT: string;
};
export declare const EMAIL_ERRORS: {
    MISSING_CONFIG: string;
    MISSING_PROVIDER_CONFIG: string;
    NO_PROVIDERS: string;
    SMTP_CONNECTION_FAILED: string;
    RESEND_TIMEOUT: string;
    RESEND_API_ERROR: string;
    RESEND_FAILED: string;
    RESEND_API_KEY_MISSING: string;
    CB_OPEN: string;
    DISPATCH_FAILED: string;
    ALL_PROVIDERS_FAILED: string;
    LOG_CREATION_FAILED: string;
    LOG_UPDATE_FAILED: string;
    TEMPLATES_INIT_FAILED: string;
    TEMPLATE_COMPILE_FAILED: string;
};
//# sourceMappingURL=email.messages.d.ts.map