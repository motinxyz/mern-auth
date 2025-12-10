/**
 * @auth/contracts - Branded ID Types
 *
 * Type-safe branded ID types to prevent accidental ID type mixing.
 * Using branded types ensures compile-time safety when passing IDs.
 */

/**
 * Branded type for type-safe User IDs.
 * Prevents accidentally passing an email log ID where a user ID is expected.
 *
 * @example
 * ```typescript
 * const userId: UserId = "123" as UserId;
 * findUser(userId); // ✅ Type-safe
 * findUser(emailLogId); // ❌ Compile error
 * ```
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
