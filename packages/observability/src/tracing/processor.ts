import { type SpanProcessor, type ReadableSpan } from "@opentelemetry/sdk-trace-base";
import type { Span, Context } from "@opentelemetry/api";

/**
 * Custom SpanProcessor that filters out unwanted spans before export.
 * Wraps another processor (e.g., BatchSpanProcessor) and only forwards spans
 * that pass the filter.
 */
export class FilteringSpanProcessor implements SpanProcessor {
    private readonly processor: SpanProcessor;
    private readonly shouldExclude: (span: ReadableSpan) => boolean;

    constructor(processor: SpanProcessor, shouldExclude: (span: ReadableSpan) => boolean) {
        this.processor = processor;
        this.shouldExclude = shouldExclude;
    }

    onStart(span: Span, context: Context): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.processor.onStart(span as any, context);
    }

    onEnd(span: ReadableSpan): void {
        // Only forward spans that pass the filter
        if (!this.shouldExclude(span)) {
            this.processor.onEnd(span);
        }
    }

    shutdown(): Promise<void> {
        return this.processor.shutdown();
    }

    forceFlush(): Promise<void> {
        return this.processor.forceFlush();
    }
}
