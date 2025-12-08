import { ILogger } from "@auth/contracts";

declare global {
    namespace Express {
        interface Request {
            /**
             * Translation function injected by i18next middleware
             */
            t: (key: string, options?: Record<string, unknown>) => string;

            /**
             * Current locale (e.g., 'en', 'es')
             * Injected by i18next or custom middleware
             */
            locale?: string;

            /**
             * Authenticated user (if present)
             * Supports both _id (MongoDB) and id (Standard) patterns
             */
            user?: {
                id?: string;
                _id?: string;
                email?: string;
                name?: string;
                role?: string;
                [key: string]: unknown;
            };

            /**
             * Request-scoped logger (child logger with request ID)
             */
            log: ILogger;

            /**
             * Flag set by connect-timeout middleware
             */
            timedout?: boolean;
        }
    }
}

export { };
