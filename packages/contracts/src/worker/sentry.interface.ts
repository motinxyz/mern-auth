/**
 * @auth/contracts - Sentry Interface
 *
 * Minimal interface for error tracking in workers.
 */

/**
 * Sentry error tracking interface.
 * Minimal interface for error reporting in workers.
 */
export interface ISentry {
    /**
     * Capture and report an exception.
     * @param error - The error to report
     * @param context - Optional additional context
     */
    captureException(error: Error, context?: Readonly<Record<string, unknown>>): void;

    /**
     * Capture and report a message.
     * @param message - The message to report
     * @param options - Optional level and extra data
     */
    captureMessage(
        message: string,
        options?: {
            readonly level?: string;
            readonly extra?: Readonly<Record<string, unknown>>;
        }
    ): void;
}
