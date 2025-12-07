/**
 * Operational Error Classes
 *
 * Internal errors for infrastructure and system operations.
 * These are not HTTP-aware and should be caught and converted
 * to HTTP errors at the API boundary.
 */

export { ConfigurationError } from "./ConfigurationError.js";
export { EnvironmentError } from "./EnvironmentError.js";
export { DatabaseConnectionError } from "./DatabaseConnectionError.js";
export { RedisConnectionError } from "./RedisConnectionError.js";
export { EmailDispatchError } from "./EmailDispatchError.js";
export { EmailServiceInitializationError } from "./EmailServiceInitializationError.js";
export { TokenCreationError } from "./TokenCreationError.js";
export { QueueError } from "./QueueError.js";
export { JobCreationError } from "./JobCreationError.js";
export { UnknownJobTypeError } from "./UnknownJobTypeError.js";
export { InvalidJobDataError } from "./InvalidJobDataError.js";
