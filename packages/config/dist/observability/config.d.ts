/**
 * Observability Configuration
 * Centralized configuration for all observability features
 */
interface TempoHeaders {
    Authorization?: string;
}
export declare const observabilityConfig: {
    enabled: any;
    loki: {
        enabled: boolean;
        url: any;
        user: any;
        apiKey: any;
        bearerToken: any;
        labels: {
            app: any;
            environment: any;
            version: any;
        };
    };
    prometheus: {
        enabled: any;
        remoteWrite: {
            enabled: boolean;
            url: any;
            username: any;
            password: any;
        };
    };
    tracing: {
        enabled: any;
        serviceName: any;
        serviceVersion: any;
        environment: any;
        hostname: any;
        tempo: {
            url: string;
            headers: TempoHeaders;
        };
    };
};
export declare function isObservabilityEnabled(): boolean;
export declare function isLokiEnabled(): boolean;
export declare function isMetricsEnabled(): boolean;
export declare function isTracingEnabled(): boolean;
export {};
//# sourceMappingURL=config.d.ts.map