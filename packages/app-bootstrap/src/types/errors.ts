/**
 * Error Types for Bootstrap
 *
 * Provides type-safe error handling without as any casts.
 */

/**
 * Error with optional cause for proper error chaining
 */
export interface ErrorWithCause extends Error {
    readonly originalError?: unknown;
    readonly cause?: unknown;
}

/**
 * Type guard for errors with original error property
 */
export function hasOriginalError(error: unknown): error is ErrorWithCause {
    return (
        error instanceof Error &&
        "originalError" in error &&
        error.originalError !== undefined
    );
}

/**
 * Extracts the original error from an error chain
 */
export function getOriginalError(error: unknown): unknown {
    if (hasOriginalError(error)) {
        return error.originalError;
    }
    return error;
}
