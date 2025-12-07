/**
 * Tracing Utilities Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    withSpan,
    addSpanAttributes,
    getTraceContext,
    addSpanEvent,
    recordError,
    createSpanLink,
} from "./tracing-utils.js";
import { trace } from "@opentelemetry/api";

// Mock OpenTelemetry
vi.mock("@opentelemetry/api", () => {
    const mockSpan = {
        setAttribute: vi.fn(),
        setStatus: vi.fn(),
        recordException: vi.fn(),
        addEvent: vi.fn(),
        end: vi.fn(),
        spanContext: vi.fn(() => ({
            traceId: "test-trace-id",
            spanId: "test-span-id",
            traceFlags: 1,
        })),
    };

    const mockTracer = {
        startActiveSpan: vi.fn((_name, _options, fn) => fn(mockSpan)),
    };

    return {
        trace: {
            getTracer: vi.fn(() => mockTracer),
            getActiveSpan: vi.fn(() => mockSpan),
        },
        SpanStatusCode: {
            OK: 1,
            ERROR: 2,
        },
    };
});

describe("Tracing Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("withSpan", () => {
        it("should execute function within a span", async () => {
            const result = await withSpan("test-span", async (span) => {
                expect(span).toBeDefined();
                return "success";
            });

            expect(result).toBe("success");
        });

        it("should pass options to the tracer", async () => {
            await withSpan(
                "test-span",
                async () => "success",
                { component: "test-component" }
            );

            const mockTracer = trace.getTracer("auth-service");
            expect(mockTracer.startActiveSpan).toHaveBeenCalled();
        });
    });

    describe("addSpanAttributes", () => {
        it("should add attributes to the active span", () => {
            addSpanAttributes({ key: "value", count: 42 });

            const span = trace.getActiveSpan();
            expect(span?.setAttribute).toHaveBeenCalledWith("key", "value");
            expect(span?.setAttribute).toHaveBeenCalledWith("count", 42);
        });

        it("should skip undefined values", () => {
            addSpanAttributes({ key: undefined });

            const span = trace.getActiveSpan();
            expect(span?.setAttribute).not.toHaveBeenCalled();
        });
    });

    describe("getTraceContext", () => {
        it("should return trace context from active span", () => {
            const context = getTraceContext();

            expect(context).toEqual({
                traceId: "test-trace-id",
                spanId: "test-span-id",
                traceFlags: 1,
            });
        });
    });

    describe("addSpanEvent", () => {
        it("should add event to active span", () => {
            addSpanEvent("test-event", { key: "value" });

            const span = trace.getActiveSpan();
            expect(span?.addEvent).toHaveBeenCalledWith("test-event", { key: "value" });
        });
    });



    describe("recordError", () => {
        it("should record exception and set error status on span", () => {
            const mockSpan = trace.getActiveSpan()!;
            const error = new Error("Test error message");

            recordError(mockSpan, error);

            expect(mockSpan.recordException).toHaveBeenCalledWith(error);
            expect(mockSpan.setStatus).toHaveBeenCalledWith({
                code: 2, // SpanStatusCode.ERROR
                message: "Test error message",
            });
            expect(mockSpan.setAttribute).toHaveBeenCalledWith("error.type", "Error");
            expect(mockSpan.setAttribute).toHaveBeenCalledWith("error.message", "Test error message");
        });

        it("should record error stack if available", () => {
            const mockSpan = trace.getActiveSpan()!;
            const error = new Error("Test error");
            error.stack = "Error: Test error\n    at test.ts:1:1";

            recordError(mockSpan, error);

            expect(mockSpan.setAttribute).toHaveBeenCalledWith("error.stack", error.stack);
        });

        it("should record HTTP status code for API errors", () => {
            const mockSpan = trace.getActiveSpan()!;
            const apiError = Object.assign(new Error("Not found"), { statusCode: 404 });

            recordError(mockSpan, apiError);

            expect(mockSpan.setAttribute).toHaveBeenCalledWith("http.status_code", 404);
        });

        it("should add additional attributes", () => {
            const mockSpan = trace.getActiveSpan()!;
            const error = new Error("Test error");

            recordError(mockSpan, error, { "request.id": "req-123", "user.id": "user-456" });

            expect(mockSpan.setAttribute).toHaveBeenCalledWith("request.id", "req-123");
            expect(mockSpan.setAttribute).toHaveBeenCalledWith("user.id", "user-456");
        });
    });

    describe("createSpanLink", () => {
        it("should create span link from valid trace context", () => {
            const traceContext = {
                traceId: "abc123",
                spanId: "def456",
                traceFlags: 1,
            };

            const result = createSpanLink(traceContext);

            expect(result).toEqual({
                context: {
                    traceId: "abc123",
                    spanId: "def456",
                    traceFlags: 1,
                },
            });
        });

        it("should return null for null trace context", () => {
            const result = createSpanLink(null);
            expect(result).toBeNull();
        });

        it("should return null for undefined trace context", () => {
            const result = createSpanLink(undefined);
            expect(result).toBeNull();
        });

        it("should return null for trace context without traceId", () => {
            const result = createSpanLink({ traceId: "", spanId: "def456", traceFlags: 1 });
            expect(result).toBeNull();
        });
    });
});
