/**
 * Custom error for failures that occur while dispatching an email.
 */
export default class EmailDispatchError extends Error {
    readonly originalError: Error | null;
    constructor(message: string, originalError?: Error | null);
}
//# sourceMappingURL=EmailDispatchError.d.ts.map