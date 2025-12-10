/**
 * @auth/contracts - Common Types Barrel Export
 *
 * Re-exports all common types for convenient importing.
 */

// Branded ID types
export type { UserId, EmailLogId, AuditLogId } from "./branded-ids.js";

// Health check interface
export type { IHealthResult } from "./health.interface.js";

// Email status types
export type { EmailStatus, BounceType } from "./email-status.js";

// Circuit breaker types
export type { CircuitBreakerState } from "./circuit-breaker.js";
