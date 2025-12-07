import type { Request, Response, NextFunction } from "express";
interface ApiVersionOptions {
    currentVersion?: string;
    deprecatedVersion?: string | null;
    sunsetDate?: string | null;
    successorVersion?: string | null;
}
interface VersionedRequest extends Request {
    apiVersion?: string;
}
/**
 * API Version Tracking and Deprecation Middleware
 *
 * Tracks API version usage and adds deprecation headers when appropriate.
 * Helps communicate API changes to clients.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.currentVersion - Current API version (e.g., 'v1')
 * @param {string} options.deprecatedVersion - Deprecated version (optional)
 * @param {string} options.sunsetDate - Sunset date for deprecated version (RFC 7231 format)
 * @param {string} options.successorVersion - Successor version (e.g., 'v2')
 * @returns {Function} Express middleware
 */
export declare const apiVersionMiddleware: (options?: ApiVersionOptions) => (req: VersionedRequest, res: Response, next: NextFunction) => void;
export {};
/**
 * Version-specific deprecation configuration
 *
 * Example usage:
 * app.use('/api', apiVersionMiddleware({
 *   currentVersion: 'v2',
 *   deprecatedVersion: 'v1',
 *   sunsetDate: 'Sat, 31 Dec 2025 23:59:59 GMT',
 *   successorVersion: 'v2'
 * }));
 */
//# sourceMappingURL=apiVersion.d.ts.map