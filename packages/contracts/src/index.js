/**
 * @auth/contracts
 *
 * Abstract interfaces for Dependency Injection.
 * Services depend on these contracts, not concrete implementations.
 */

export { ICacheService } from "./ICacheService.js";
export { IQueueProducer } from "./IQueueProducer.js";
export { ITokenService } from "./ITokenService.js";
export { default as IEmailProvider } from "./IEmailProvider.js";
