/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "opossum" {
    import { EventEmitter } from "events";

    export interface CircuitBreakerStats {
        failures: number;
        fires: number;
        successes: number;
        fallbacks: number;
        rejects: number;
        timeouts: number;
        [key: string]: unknown;
    }

    class CircuitBreaker<TI = any, TR = unknown> extends EventEmitter {
        constructor(action: (...args: TI[]) => Promise<TR>, options?: Record<string, unknown>);
        fire(...args: TI[]): Promise<TR>;
        stats: CircuitBreakerStats;
        opened: boolean;
        halfOpen: boolean;
        closed: boolean;
    }

    export = CircuitBreaker;
}
