// Export services
export { default as EmailService } from "./email.service.js";
export { default as ProviderService } from "./provider.service.js";

// Export constants
export { DEFAULT_CIRCUIT_BREAKER_CONFIG } from "./types.js";

// Export providers
export { default as ResendProvider } from "./providers/resend.provider.js";
export { default as MailerSendProvider } from "./providers/mailersend.provider.js";

// Export bounce handler
export { handleBounce, isEmailValid } from "./bounce-handler.js";
export { default as bounceHandler } from "./bounce-handler.js";

// Export types
export type {
  // Provider types
  IEmailProvider,
  MailOptions,
  EmailResult,
  ProviderHealth,
  WebhookHeaders,
  ParsedWebhookEvent,
  // Provider service types
  IProviderService,
  ProviderServiceOptions,
  ProviderConfig,
  SendOptions,
  ProvidersHealthResult,
  // Email service types
  EmailServiceOptions,
  EmailServiceConfig,
  SendEmailParams,
  EmailUser,
  CircuitBreakerStats,
  CircuitBreakerHealth,
  EmailServiceHealth,
  // Bounce handler types
  BounceData,
  BounceHandlerResult,
  // Template types
  TemplateInitOptions,
} from "./types.js";
