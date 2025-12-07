import { getLogger } from "@auth/config";
const logger = getLogger();
import { API_MESSAGES } from "../../constants/api.messages.js";
const versionLogger = logger.child({ module: "api-version" });
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
export const apiVersionMiddleware = (options = {}) => {
    const { currentVersion = "v1", deprecatedVersion = null, sunsetDate = null, successorVersion = null, } = options;
    return (req, res, next) => {
        // Extract version from URL path (e.g., /api/v1/auth -> v1)
        const pathParts = req.path.split("/");
        const versionIndex = pathParts.findIndex((part) => part.startsWith("v"));
        const requestedVersion = versionIndex !== -1
            ? pathParts[versionIndex] // eslint-disable-line security/detect-object-injection
            : null;
        // Add version to request for logging
        req.apiVersion = requestedVersion ?? currentVersion;
        // Log version usage
        versionLogger.debug({
            requestId: req.id,
            version: req.apiVersion,
            path: req.path,
        }, API_MESSAGES.API_VERSION_REQUEST);
        // Add deprecation headers if this version is deprecated
        if (deprecatedVersion !== null &&
            deprecatedVersion !== undefined &&
            requestedVersion === deprecatedVersion) {
            res.setHeader("Deprecation", "true");
            if (sunsetDate !== null && sunsetDate !== undefined) {
                res.setHeader("Sunset", sunsetDate);
            }
            if (successorVersion !== null && successorVersion !== undefined) {
                const successorPath = req.path.replace(`/${deprecatedVersion}/`, `/${successorVersion}/`);
                res.setHeader("Link", `<${successorPath}>; rel="successor-version"`);
            }
            versionLogger.warn({
                requestId: req.id,
                deprecatedVersion,
                sunsetDate,
                successorVersion,
            }, API_MESSAGES.API_VERSION_DEPRECATED);
        }
        // Add current version header
        res.setHeader("X-API-Version", req.apiVersion);
        next();
    };
};
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
//# sourceMappingURL=apiVersion.js.map