import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { httpLogger } from "./loggerMiddleware.js";
import expressMongoSanitize from "@exortek/express-mongo-sanitize";
import { config } from "@auth/config";
export const configureSecurityMiddleware = (app) => {
    // Enable CORS with secure options from centralized config
    app.use(cors({
        origin: (origin, callback) => {
            const allowedOrigins = config.cors.allowedOrigins;
            if (origin === undefined || allowedOrigins.includes(origin) === true) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: config.cors.credentials,
    }));
    // Enhanced security headers with production-grade helmet configuration
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
        },
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin",
        },
        noSniff: true,
        xssFilter: true,
        hidePoweredBy: true,
    }));
    // Prevent HTTP Parameter Pollution
    app.use(hpp());
    // Sanitize data to prevent NoSQL injection
    // @ts-expect-error - expressMongoSanitize types don't expose call signature
    app.use(expressMongoSanitize());
};
import compression from "compression";
export const configureParsingMiddleware = (app) => {
    // Response compression (gzip/deflate)
    app.use(compression({
        filter: (req, res) => {
            // Don't compress if client sends x-no-compression header
            if (req.headers["x-no-compression"] !== undefined) {
                return false;
            }
            // Use compression filter (checks Content-Type)
            return compression.filter(req, res);
        },
        level: 6, // Balance between speed and compression ratio (0-9)
        threshold: 1024, // Only compress responses larger than 1KB
    }));
    // Parse json request body
    app.use(express.json());
    // Parse urlencoded request body
    app.use(express.urlencoded({ extended: true }));
    // Log HTTP requests
    app.use(httpLogger);
};
export const configureMiddleware = (app) => {
    configureSecurityMiddleware(app);
    configureParsingMiddleware(app);
};
//# sourceMappingURL=setup.js.map