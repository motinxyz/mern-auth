// This file is the public API for the @auth/queues package.

// It should export only the tools needed by other packages to add jobs to the queues,
// primarily the "producers".

// It intentionally does not export the queue instances themselves to prevent
// other packages from depending on the internal implementation details of BullMQ.

export * from "./producers/index.js";
export * from "./queue.constants.js";
export { default as redisConnection } from "./connection.js";
