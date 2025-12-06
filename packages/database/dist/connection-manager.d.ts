import mongoose from "mongoose";
import type { ILogger } from "@auth/contracts";
/**
 * Database Connection Manager
 * Provides connection state management and health checks
 */
declare class DatabaseConnectionManager {
    config: any;
    logger: ILogger;
    isConnected: boolean;
    constructor(options: {
        config: any;
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
        readyStateLabel: any;
    };
    /**
     * Get human-readable connection state
     */
    getReadyStateLabel(): any;
    /**
     * Health check
     */
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        reason?: undefined;
    } | {
        healthy: boolean;
        reason: any;
    }>;
    /**
     * Simple ping check
     */
    ping(): Promise<boolean>;
}
export default DatabaseConnectionManager;
//# sourceMappingURL=connection-manager.d.ts.map