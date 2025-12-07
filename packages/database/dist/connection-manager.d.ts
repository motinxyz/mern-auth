import mongoose from "mongoose";
import type { ILogger, IConfig } from "@auth/contracts";
/**
 * Database Connection Manager
 * Provides connection state management and health checks
 */
declare class DatabaseConnectionManager {
    config: IConfig;
    logger: ILogger;
    isConnected: boolean;
    constructor(options: {
        config: IConfig;
        logger: ILogger;
    });
    /**
     * Setup event listeners for connection lifecycle
     * Checks actual listener count to prevent duplicates across reloads
     */
    setupEventListeners(): void;
    /**
     * Connect to database with retry logic
     */
    connect(): Promise<void>;
    /**
     * Disconnect from database
     */
    disconnect(): Promise<void>;
    /**
     * Check if database is connected
     */
    getConnectionState(): {
        isConnected: boolean;
        readyState: mongoose.ConnectionStates;
        readyStateLabel: string;
    };
    /**
     * Get human-readable connection state
     */
    getReadyStateLabel(): string;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        reason: string;
    } | {
        healthy: boolean;
        reason?: undefined;
    }>;
    /**
     * Simple ping check
     */
    ping(): Promise<boolean>;
}
export default DatabaseConnectionManager;
//# sourceMappingURL=connection-manager.d.ts.map