/**
 * @auth/contracts - Common Types
 *
 * Shared type definitions, branded types, and base interfaces used across
 * multiple contract files for consistency and type safety.
 */

// =============================================================================
// Branded ID Types
// =============================================================================

/**
 * Branded type for type-safe User IDs.
 * Prevents accidentally passing an email log ID where a user ID is expected.
 *
 * @example
 * const userId: UserId = "123" as UserId;
 * findUser(userId); // ✅ Type-safe
 * findUser(emailLogId); // ❌ Compile error
 */
export type UserId = string & { readonly __brand: "UserId" };

/**
 * Branded type for type-safe Email Log IDs.
 */
export type EmailLogId = string & { readonly __brand: "EmailLogId" };

/**
 * Branded type for type-safe Audit Log IDs.
 */
export type AuditLogId = string & { readonly __brand: "AuditLogId" };

// =============================================================================
// Base Health Check Interface
// =============================================================================

/**
 * Base interface for all health check results.
 * All service health checks should extend or implement this interface.
 */
export interface IHealthResult {
    /** Whether the service is healthy and operational */
    readonly healthy: boolean;
    /** Optional error message if unhealthy */
    readonly error?: string | undefined;
}

// =============================================================================
// Email Status Types
// =============================================================================

/**
 * All possible email delivery statuses.
 * Used by IEmailLog and related email operations.
 */
export type EmailStatus =
    | "queued"
    | "pending"
    | "sent"
    | "delivered"
    | "bounced"
    | "failed";

/**
 * Email bounce types for classification.
 * - soft: Temporary delivery failure
 * - hard: Permanent delivery failure
 * - complaint: Spam complaint from recipient
 */
export type BounceType = "soft" | "hard" | "complaint";

// =============================================================================
// Circuit Breaker Types
// =============================================================================

/**
 * Circuit breaker state values.
 */
export type CircuitBreakerState = "closed" | "open" | "half-open" | "unknown";

// =============================================================================
// Email Template Types
// =============================================================================

/**
 * Available email template names.
 *
 * Add new template names here when creating new email templates.
 * This provides type-safe autocomplete and prevents template name typos.
 *
 * @example
 * sendEmail({ template: "verification", data: {...} })
 */
export type EmailTemplate =
    | "verification"
    | "welcome"
    | "password-reset"
    | "password-changed"
    | "account-locked"
    | "login-alert"
    | "notification";

