import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCircuitBreaker } from "./circuit-breaker.js";
describe("Circuit Breaker", () => {
    let successfulOperation;
    let failingOperation;
    beforeEach(() => {
        successfulOperation = vi.fn(async () => "success");
        failingOperation = vi.fn(async () => {
            throw new Error("Operation failed");
        });
    });
    it("should execute successful operations normally", async () => {
        const breaker = createCircuitBreaker(successfulOperation, {
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 5000,
        });
        const result = await breaker.fire();
        expect(result).toBe("success");
        expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
    it("should open circuit after threshold failures", async () => {
        const breaker = createCircuitBreaker(failingOperation, {
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 5000,
            volumeThreshold: 2, // Minimum requests before opening
        });
        // First failure
        await expect(breaker.fire()).rejects.toThrow("Operation failed");
        // Second failure - should open circuit
        await expect(breaker.fire()).rejects.toThrow("Operation failed");
        // Third attempt - circuit should be open
        await expect(breaker.fire()).rejects.toThrow();
        // Operation should not be called the third time (circuit is open)
        expect(failingOperation).toHaveBeenCalledTimes(2);
    });
    it("should timeout slow operations", async () => {
        const slowOperation = vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return "slow success";
        });
        const breaker = createCircuitBreaker(slowOperation, {
            timeout: 500, // 500ms timeout
            errorThresholdPercentage: 50,
            resetTimeout: 5000,
        });
        await expect(breaker.fire()).rejects.toThrow();
    });
    it("should transition to half-open state after reset timeout", async () => {
        const breaker = createCircuitBreaker(failingOperation, {
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 100, // Short reset timeout for testing
            volumeThreshold: 1,
        });
        // Open the circuit
        await expect(breaker.fire()).rejects.toThrow();
        await expect(breaker.fire()).rejects.toThrow();
        expect(breaker.opened).toBe(true);
        // Wait for reset timeout
        await new Promise((resolve) => setTimeout(resolve, 150));
        // Circuit should be half-open now
        expect(breaker.halfOpen).toBe(true);
    });
    it("should close circuit after successful operation in half-open state", async () => {
        let callCount = 0;
        const intermittentOperation = vi.fn(async () => {
            callCount++;
            if (callCount <= 2) {
                throw new Error("Failing");
            }
            return "success";
        });
        const breaker = createCircuitBreaker(intermittentOperation, {
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 100,
            volumeThreshold: 2,
        });
        // Open the circuit with failures
        await expect(breaker.fire()).rejects.toThrow();
        await expect(breaker.fire()).rejects.toThrow();
        expect(breaker.opened).toBe(true);
        // Wait for reset timeout
        await new Promise((resolve) => setTimeout(resolve, 150));
        // Next call should succeed and close the circuit
        const result = await breaker.fire();
        expect(result).toBe("success");
        expect(breaker.closed).toBe(true);
    });
    it("should provide statistics", async () => {
        const breaker = createCircuitBreaker(successfulOperation, {
            timeout: 1000,
            errorThresholdPercentage: 50,
            resetTimeout: 5000,
        });
        await breaker.fire();
        await breaker.fire();
        const stats = breaker.stats;
        expect(stats.fires).toBe(2);
        expect(stats.successes).toBe(2);
        expect(stats.failures).toBe(0);
    });
});
//# sourceMappingURL=circuit-breaker.test.js.map