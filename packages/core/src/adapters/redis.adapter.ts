import type { ICacheService } from "@auth/contracts";
import type { ExtendedRedis } from "@auth/config";

/**
 * RedisCacheAdapter
 *
 * Adapts ioredis interface to ICacheService contract.
 * Ensures strict type compliance and decouples application from direct Redis dependency.
 */
export class RedisCacheAdapter implements ICacheService {
    constructor(private readonly redis: ExtendedRedis) { }

    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    async set(
        key: string,
        value: string,
        expiryMode?: "EX" | "PX",
        ttl?: number
    ): Promise<string> {
        if (expiryMode === "EX" && ttl !== undefined) {
            return this.redis.set(key, value, "EX", ttl);
        }
        if (expiryMode === "PX" && ttl !== undefined) {
            return this.redis.set(key, value, "PX", ttl);
        }
        return this.redis.set(key, value);
    }

    async del(key: string): Promise<number> {
        return this.redis.del(key);
    }

    async ttl(key: string): Promise<number> {
        return this.redis.ttl(key);
    }

    async exists(key: string): Promise<number> {
        return this.redis.exists(key);
    }

    async ping(): Promise<string> {
        return this.redis.ping();
    }
}
