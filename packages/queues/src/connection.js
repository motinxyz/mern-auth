import { redisConnection } from "@auth/config/redis";

// This file acts as a stable internal pointer to the centralized Redis connection.
// It allows the rest of the `queues` package to have a consistent internal API
// while allowing the actual connection source to be managed externally.
export default redisConnection;