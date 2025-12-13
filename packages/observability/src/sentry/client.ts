import * as Sentry from "@sentry/node";
import { isSentryEnabled } from "../config.js";

/**
 * Capture an exception to Sentry
 * Wrapper to decouple application code from Sentry SDK
 * 
 * @param error - The error to capture
 * @param context - Additional context (tags, extra data)
 */
export function captureException(
    error: unknown,
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
        user?: { id: string; email?: string };
    }
): void {
    if (!isSentryEnabled()) return;

    Sentry.withScope((scope) => {
        if (context?.tags) scope.setTags(context.tags);
        if (context?.extra) scope.setExtras(context.extra);
        if (context?.user) scope.setUser(context.user);

        Sentry.captureException(error);
    });
}
