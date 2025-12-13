/**
 * @auth/contracts - Repository Types Barrel Export
 */

// Base repository interface
export type { IRepository } from "./repository.interface.js";
export type { FindOptions, SortDirection } from "./query-options.interface.js";

// Entity-specific repositories
export type { IUserRepository, PaginationResult } from "./user.repository.js";
export type { IEmailLogRepository } from "./email-log.repository.js";
export type { IAuditLogRepository } from "./audit-log.repository.js";
