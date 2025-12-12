/**
 * Internal logging configuration derived from environment
 */
export interface LogConfig {
    isDevelopment: boolean;
    level?: string;
    serviceName: string;
    environment: string;
}
