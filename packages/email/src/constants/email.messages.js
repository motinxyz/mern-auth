/**
 * Email Package Messages Constants
 *
 * Production-grade hardcoded English messages for DevOps observability.
 * These are NOT translated because they are dev-facing logs.
 */

export const EMAIL_MESSAGES = {
  // Service Lifecycle
  SERVICE_INITIALIZED: "Email service initialized successfully",
  PROVIDERS_INITIALIZED: "Initialized {count} email provider(s): {providers}",
  SMTP_NOT_CONFIGURED: "SMTP transport not configured",

  // SMTP Messages
  SMTP_CONFIGURED: "SMTP transport configured",
  SMTP_CONNECTION_VERIFIED: "SMTP connection verified successfully",

  // Resend Messages
  RESEND_INITIALIZED: "Resend API provider initialized",
  RESEND_RETRYING: "Resend API retrying",
  RESEND_SENT: "Email sent via Resend API",

  // Circuit Breaker Logs
  CB_OPEN: "Circuit breaker opened - Email service failing",
  CB_HALF_OPEN: "Circuit breaker half-open - Testing email service recovery",
  CB_CLOSED: "Circuit breaker closed - Email service recovered",
  CB_SUCCESS: "Email sent successfully through circuit breaker",
  CB_FAILURE: "Email sending failed through circuit breaker",
  CB_TIMEOUT: "Email sending timed out",
  CB_REJECT: "Email request rejected - circuit is open or at capacity",

  // Email Operation Logs
  ATTEMPTING_SEND: "Attempting to send email",
  SEND_SUCCESS: "Email sent successfully",
  PREPARING_VERIFICATION: "Preparing verification email",
  SENDING_VERIFICATION: "Sending verification email",
  PROVIDER_ATTEMPT: "Attempting to send via {provider}",
  PROVIDER_SUCCESS: "Email sent successfully via {provider}",
  PROVIDER_FAILOVER: "Failed to send via {provider}, trying next provider",

  // Template Engine
  TEMPLATES_INITIALIZED: "Email templates initialized successfully",

  // Bounce Handler
  BOUNCE_LOG_NOT_FOUND: "Email log not found for bounce",
  BOUNCE_HARD_RETRY_SMTP: "Hard bounce from Resend - will retry via Gmail SMTP",
  BOUNCE_USER_MARKED_INVALID: "User email marked as invalid due to hard bounce",
  BOUNCE_SOFT_RECORDED: "Soft bounce recorded - will retry later",
  BOUNCE_SPAM_COMPLAINT: "User marked email as spam - unsubscribed",
};

export const EMAIL_ERRORS = {
  // Configuration Errors
  MISSING_CONFIG: "{config} is required for EmailService",
  MISSING_PROVIDER_CONFIG: "{config} is required for ProviderService",
  NO_PROVIDERS: "No email providers configured",

  // SMTP Errors
  SMTP_CONNECTION_FAILED: "SMTP connection verification failed",

  // Resend Errors
  RESEND_TIMEOUT: "Resend API request timeout",
  RESEND_API_ERROR: "Resend API error",
  RESEND_FAILED: "Resend API failed to send email",
  RESEND_API_KEY_MISSING: "Resend API key is missing",

  // Circuit Breaker Errors
  CB_OPEN: "Email service temporarily unavailable - circuit breaker is open",

  // Dispatch Errors
  DISPATCH_FAILED: "Failed to dispatch email",
  ALL_PROVIDERS_FAILED: "All providers failed: {details}",
  LOG_CREATION_FAILED: "Failed to create email log entry",
  LOG_UPDATE_FAILED: "Failed to update email log",

  // Template Errors
  TEMPLATES_INIT_FAILED: "Failed to initialize email templates",
  TEMPLATE_COMPILE_FAILED: "Failed to compile template '{template}': {error}",
};
