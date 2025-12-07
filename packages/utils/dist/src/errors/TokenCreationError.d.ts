/**
 * Custom error for failures that occur during token creation or storage.
 */
export default class TokenCreationError extends Error {
    readonly originalError: Error | null;
    constructor(message: string, originalError?: Error | null);
}
//# sourceMappingURL=TokenCreationError.d.ts.map