/**
 * Bootstrap Types
 *
 * Type definitions for the app-bootstrap package.
 * These types are exported for consumers who need to type their own bootstrap logic.
 */

import type { IDatabaseService, IEmailService } from "@auth/contracts";

/**
 * Result of common services initialization
 */
export interface InitializedServices {
    readonly databaseService: IDatabaseService;
    readonly emailService: IEmailService;
}

/**
 * Service definition for parallel initialization
 */
export interface ServiceDefinition {
    readonly name: string;
    readonly init: () => Promise<void>;
}

/**
 * Health check result for bootstrap services
 */
export interface BootstrapHealth {
    readonly healthy: boolean;
    readonly database: {
        readonly healthy: boolean;
        readonly readyState: number;
    };
    readonly email: {
        readonly healthy: boolean;
    };
    readonly queues: {
        readonly healthy: boolean;
    };
}
